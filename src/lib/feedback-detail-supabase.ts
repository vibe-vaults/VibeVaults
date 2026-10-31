/**
 * Main Responsibility: The dashboard's `FeedbackDetailBackend`: replies and
 * attachments from Supabase (RLS-scoped browser client), live updates over
 * Realtime, writes through the feedback server actions, and the presigned
 * upload flow for reply files.
 *
 * Sensitive Dependencies:
 * - Uploads go browser -> Storage directly (presigned PUT), never through a
 *   serverless function: Vercel caps request bodies at 4.5MB on every plan.
 *   `/api/dashboard/upload` and `/confirm` both run the owner-billing guard.
 * - Server actions in `@/actions/feedback` own authorization and the
 *   workspace paywall; nothing here re-checks it.
 */
import { createClient } from "@/lib/supabase/client"
import { sendAgencyReplyAction, deleteFeedback, updateFeedbackStatus } from "@/actions/feedback"
import type { DetailReply, FeedbackDetailBackend } from "@/lib/feedback-detail-backend"

export function createSupabaseFeedbackBackend(): FeedbackDetailBackend {
    const supabase = createClient()

    return {
        async currentUserName() {
            const { data } = await supabase.auth.getUser()
            return data.user?.email ?? null
        },

        async fetchReplies(feedbackId) {
            const { data, error } = await supabase
                .from('feedback_replies')
                .select('*, feedback_attachments(id, file_name, file_url, file_size, mime_type)')
                .eq('feedback_id', feedbackId)
                .order('created_at', { ascending: true })
            if (error) throw error
            return (data || []).map(r => ({
                ...r,
                attachments: r.feedback_attachments || [],
                feedback_attachments: undefined,
            })) as DetailReply[]
        },

        async fetchAttachments(feedbackId) {
            const { data, error } = await supabase
                .from('feedback_attachments')
                .select('*')
                .eq('feedback_id', feedbackId)
                .is('reply_id', null)
                .order('created_at', { ascending: true })
            if (error) throw error
            return data || []
        },

        subscribe(feedbackId, onChange) {
            const channel = supabase
                .channel(`replies-${feedbackId}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'feedback_replies', filter: `feedback_id=eq.${feedbackId}` },
                    () => onChange('replies')
                )
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'feedback_attachments', filter: `feedback_id=eq.${feedbackId}` },
                    () => onChange('all')
                )
                .subscribe()
            return () => { supabase.removeChannel(channel) }
        },

        async sendReply(feedbackId, content, files) {
            const replyResult = await sendAgencyReplyAction(feedbackId, content)
            if (replyResult?.error) return { error: replyResult.error }
            if (files.length === 0) return {}

            // Step 1: Get presigned upload URLs
            const fileMeta = files.map(f => ({ name: f.name, size: f.size, type: f.type }))
            const urlRes = await fetch('/api/dashboard/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedbackId, files: fileMeta }),
            })
            if (!urlRes.ok) {
                const err = await urlRes.json().catch(() => ({}))
                return { uploadError: err.error || "Failed to upload files." }
            }
            const { projectId, feedbackId: fbId, uploads } = await urlRes.json()

            // Step 2: Upload each file directly to Supabase Storage
            const completedFiles = []
            for (let i = 0; i < uploads.length; i++) {
                const upload = uploads[i]
                await fetch(upload.signedUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': upload.mimeType },
                    body: files[i],
                })
                completedFiles.push({
                    fileId: upload.fileId,
                    path: upload.path,
                    fileName: upload.fileName,
                    size: files[i].size,
                    mimeType: upload.mimeType,
                })
            }

            // Step 3: Confirm uploads
            await fetch('/api/dashboard/upload/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, feedbackId: fbId, replyId: replyResult?.replyId || null, files: completedFiles }),
            })
            return {}
        },

        async setStatus(feedbackId, status) {
            const result = await updateFeedbackStatus(feedbackId, status)
            return result?.error ? { error: result.error } : {}
        },

        async deleteFeedback(feedbackId) {
            const result = await deleteFeedback(feedbackId)
            return result?.error ? { error: result.error } : {}
        },
    }
}
