/**
 * Main Responsibility: Handles server-side operations for feedback management including status updates, 
 * deletion, and creating manual feedback or agency replies. Enforces RLS permissions on the backend.
 * 
 * Sensitive Dependencies: 
 * - Supabase Server Client (@/lib/supabase/server) for authenticated operations.
 * - Supabase Admin Client (@/lib/supabase/admin) for overriding RLS during email preference fetching.
 * - Next.js Cache (revalidatePath) for updating customized UI endpoints after mutation.
 * - Feedback service (@/lib/feedback-service) holds the status/reply rules shared with the MCP tools.
 * - Notifications library (@/lib/notifications) to orchestrate Resend emails for manual feedback.
 */
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getNotificationPrefs } from "@/lib/notification-prefs";
import { shouldSendFeedbackImmediately, recordEmailSent, queueDigestEmail } from "@/lib/email-digest";
import { checkFeedbackWorkspaceActive, checkProjectWorkspaceActive } from "@/lib/tier-helpers";
import { updateFeedbackStatusCore, sendAgencyReplyCore } from "@/lib/feedback-service";


export async function updateFeedbackStatus(id: string, status: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in to update feedback." };

    const result = await updateFeedbackStatusCore(supabase, user, id, status);
    if (result.error) return result;

    revalidatePath('/dashboard/feedback');
    revalidatePath(`/dashboard/feedback/${id}`);
    return { error: null };
}

export async function deleteFeedback(id: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in to delete feedback." };

    const paused = await checkFeedbackWorkspaceActive(id, user.id);
    if (paused) return { error: paused };

    const { data, error } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', id)
        .select('id');

    if (error) {
        return { error: 'Failed to delete feedback.' };
    }

    if (!data || data.length === 0) {
        return { error: 'Feedback not found or you no longer have access.' };
    }

    revalidatePath('/dashboard/feedback');
    return { error: null };
}

export async function sendAgencyReplyAction(feedbackId: string, content: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in to reply.", replyId: null };

    const result = await sendAgencyReplyCore(supabase, user, feedbackId, content);
    if (result.error) return result;

    revalidatePath('/dashboard/feedback');
    revalidatePath(`/dashboard/feedback/${feedbackId}`);
    return result;
}


export async function addManualFeedbackAction(projectId: string, content: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be logged in to add feedback.", success: false, feedback_id: null };

    // Verify ownership via RLS
    const { data: project, error: checkError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .single();

    if (checkError || !project) return { error: "You no longer have access to this project. Your access may have been revoked.", success: false, feedback_id: null };

    const paused = await checkProjectWorkspaceActive(projectId, user.id);
    if (paused) return { error: paused, success: false, feedback_id: null };

    const feedbackId = crypto.randomUUID();

    const { error: insertError } = await supabase.from('feedbacks').insert({
        id: feedbackId,
        content,
        type: 'Feature',
        sender: user.email || 'Agency Member',
        project_id: projectId,
        status: 'open',
        metadata: {
            is_manual: true
        }
    });

    if (insertError) return { error: "Failed to add feedback. Your access may have been revoked.", success: false, feedback_id: null };

    // Notify all workspace members via email (digest-aware)
    try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const { sendFeedbackNotification } = await import("@/lib/notifications");

        const adminSupabase = createAdminClient();

        const { data: projectData } = await adminSupabase
            .from('projects')
            .select('name, workspace_id, website_url')
            .eq('id', projectId)
            .single();

        if (projectData && projectData.workspace_id) {
            const { data: memberRows } = await adminSupabase
                .from('workspace_members')
                .select('user_id')
                .eq('workspace_id', projectData.workspace_id);

            if (memberRows && memberRows.length > 0) {
                const memberIds = memberRows.filter(m => m.user_id !== user.id).map(m => m.user_id);

                const { data: profiles } = await adminSupabase
                    .from('profiles')
                    .select('email')
                    .in('id', memberIds);

                if (profiles) {
                    const emailPayload = { content, sender: user.email || 'Agency Member', metadata: { is_manual: true }, projectName: projectData.name, workspaceId: projectData.workspace_id, projectId, feedbackId };

                    for (const p of profiles) {
                        const email = p.email;
                        if (!email) continue;

                        const prefs = await getNotificationPrefs(email, 'new_feedback');
                        if (!prefs.shouldNotify) continue;

                        const sendNow = await shouldSendFeedbackImmediately(email, projectId);

                        if (sendNow) {
                            await sendFeedbackNotification({
                                to: email,
                                projectName: projectData.name,
                                content,
                                sender: user.email || 'Agency Member',
                                metadata: { is_manual: true },
                                unsubscribeToken: prefs.unsubscribeToken,
                                workspaceId: projectData.workspace_id,
                                projectId,
                                feedbackId
                            });
                            await recordEmailSent({
                                recipientEmail: email,
                                notificationType: 'new_feedback',
                                projectId,
                                feedbackId,
                                payload: emailPayload
                            });
                        } else {
                            await queueDigestEmail({
                                recipientEmail: email,
                                notificationType: 'new_feedback',
                                projectId,
                                feedbackId,
                                payload: emailPayload
                            });
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error("VibeVaults: Manual feedback email error", e);
    }

    revalidatePath('/dashboard/feedback');
    return { error: null, success: true, feedback_id: feedbackId };
}
