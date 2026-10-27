/**
 * Main Responsibility: The write-side rules for feedback that must behave identically no matter
 * who triggers them: the dashboard (server actions in `@/actions/feedback`) and AI agents (the MCP
 * tools). Status updates and agency replies live here, including the owner-billing gate and every
 * email / digest notification, so a reply sent by an agent notifies exactly like one typed in the UI.
 *
 * Sensitive Dependencies:
 * - Takes the caller's user-scoped Supabase client, so RLS decides what is visible. Never pass an
 *   admin client as `supabase`.
 * - `tier-helpers` owner-billing guards: a workspace is live only while its OWNER pays.
 * - `notifications`, `email-digest`, `notification-prefs` for the reply email fan-out.
 * - No `revalidatePath` here (it is a Next.js server-action concern); callers revalidate.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReplyNotification, sendAgencyReplyNotification } from "@/lib/notifications";
import { getNotificationPrefs } from "@/lib/notification-prefs";
import { shouldSendReplyImmediately, recordEmailSent, queueDigestEmail } from "@/lib/email-digest";
import { checkFeedbackWorkspaceActive, checkWorkspaceActive } from "@/lib/tier-helpers";

/** Mirrors the `feedbacks_status_check` DB constraint. */
export const FEEDBACK_STATUSES = ['open', 'in progress', 'in review', 'completed'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export function isFeedbackStatus(value: string): value is FeedbackStatus {
    return (FEEDBACK_STATUSES as readonly string[]).includes(value);
}

/** The slice of an authenticated user these functions need. */
export type FeedbackActor = { id: string; email?: string | null };

export async function updateFeedbackStatusCore(supabase: SupabaseClient, user: FeedbackActor, id: string, status: string) {
    if (!isFeedbackStatus(status)) return { error: 'Invalid status.' };

    // A workspace is usable only while its OWNER pays. RLS can't see that (it
    // only knows membership), so the billing gate has to be explicit here —
    // otherwise a member of a lapsed owner keeps mutating data through a tab
    // that was open before the lock landed, or by calling the action directly.
    const paused = await checkFeedbackWorkspaceActive(id, user.id);
    if (paused) return { error: paused };

    const { data, error } = await supabase
        .from('feedbacks')
        .update({ status })
        .eq('id', id)
        .select('id');

    if (error) {
        return { error: 'Failed to update feedback status.' };
    }

    if (!data || data.length === 0) {
        return { error: 'Feedback not found or you no longer have access.' };
    }

    // Mark associated notifications as read
    await supabase.from('notifications').update({ is_read: true }).eq('feedback_id', id);

    return { error: null };
}

export async function sendAgencyReplyCore(
    supabase: SupabaseClient,
    user: FeedbackActor,
    feedbackId: string,
    content: string,
    /** Extra `feedback_replies.metadata`, e.g. the MCP `ai_assisted` marker. */
    metadata?: Record<string, unknown>,
) {
    // Verify ownership via RLS
    const { data: feedback, error: checkError } = await supabase
        .from('feedbacks')
        .select('*, projects!inner(id, name, workspace_id, website_url)')
        .eq('id', feedbackId)
        .single();

    if (checkError || !feedback) return { error: "Feedback not found or you no longer have access.", replyId: null };
    const project = feedback.projects as unknown as { id: string; name: string; workspace_id: string; website_url: string | null };

    const paused = await checkWorkspaceActive(project.workspace_id, user.id);
    if (paused) return { error: paused, replyId: null };

    const { data: replyData, error: replyError } = await supabase
        .from('feedback_replies')
        .insert({
            feedback_id: feedbackId,
            content,
            user_id: user.id,
            author_role: 'agency',
            author_name: user.email || 'Support',
            ...(metadata ? { metadata } : {}),
        })
        .select('id')
        .single();

    if (replyError || !replyData) return { error: "Failed to send reply. Your access may have been revoked.", replyId: null };

    // Mark associated notifications as read
    await supabase.from('notifications').update({ is_read: true }).eq('feedback_id', feedbackId);

    // Send notification to feedback sender (skip if replier IS the sender)
    const senderEmail = user.email || 'Someone';
    const aiAssisted = metadata?.ai_assisted === true;
    const alreadyNotified = new Set<string>([user.email || '']);

    if (feedback.sender && feedback.sender.includes('@') && feedback.sender !== user.email) {
        alreadyNotified.add(feedback.sender);
        const prefs = await getNotificationPrefs(feedback.sender, 'replies');

        if (prefs.shouldNotify) {
            const replyPayload = { replyContent: content, sender: senderEmail, projectName: project.name, originalFeedback: feedback.content, workspaceId: project.workspace_id, projectId: project.id, feedbackId, aiAssisted };
            const sendNow = await shouldSendReplyImmediately(feedback.sender, feedbackId);

            if (sendNow) {
                await sendReplyNotification({
                    to: feedback.sender,
                    projectName: project.name,
                    replyContent: content,
                    originalFeedback: feedback.content,
                    sender: senderEmail,
                    unsubscribeToken: prefs.unsubscribeToken,
                    recipientKind: prefs.recipientKind,
                    siteUrl: project.website_url ?? undefined,
                    aiAssisted
                });
                await recordEmailSent({
                    recipientEmail: feedback.sender,
                    notificationType: 'reply',
                    projectId: project.id,
                    feedbackId,
                    payload: replyPayload
                });
            } else {
                await queueDigestEmail({
                    recipientEmail: feedback.sender,
                    notificationType: 'reply',
                    projectId: project.id,
                    feedbackId,
                    payload: replyPayload
                });
            }
        }
    }

    // Notify other thread participants (workspace members who previously replied)
    try {
        const adminSupabase = createAdminClient();
        const { data: threadReplies } = await adminSupabase
            .from('feedback_replies')
            .select('author_name')
            .eq('feedback_id', feedbackId)
            .neq('id', replyData.id);

        if (threadReplies) {
            const participantEmails = [...new Set(
                threadReplies
                    .map(r => r.author_name)
                    .filter((email): email is string => !!email && email.includes('@') && !alreadyNotified.has(email))
            )];

            for (const email of participantEmails) {
                const prefs = await getNotificationPrefs(email, 'replies');
                if (!prefs.shouldNotify) continue;

                const replyPayload = { replyContent: content, sender: senderEmail, projectName: project.name, workspaceId: project.workspace_id, projectId: project.id, feedbackId, aiAssisted };
                const sendNow = await shouldSendReplyImmediately(email, feedbackId);

                if (sendNow) {
                    await sendAgencyReplyNotification({
                        to: email,
                        projectName: project.name,
                        replyContent: content,
                        sender: senderEmail,
                        unsubscribeToken: prefs.unsubscribeToken,
                        workspaceId: project.workspace_id,
                        projectId: project.id,
                        feedbackId,
                        recipientKind: prefs.recipientKind,
                        siteUrl: project.website_url ?? undefined,
                        aiAssisted
                    });
                    await recordEmailSent({
                        recipientEmail: email,
                        notificationType: 'reply',
                        projectId: project.id,
                        feedbackId,
                        payload: replyPayload
                    });
                } else {
                    await queueDigestEmail({
                        recipientEmail: email,
                        notificationType: 'reply',
                        projectId: project.id,
                        feedbackId,
                        payload: replyPayload
                    });
                }
            }
        }
    } catch (e) {
        console.error("VibeVaults: Thread participant notification error", e);
    }
    return { error: null, replyId: replyData.id };
}
