/**
 * Main Responsibility: The data seam of the feedback detail view. The view
 * (`FeedbackDetailView`) renders a report, its thread and its controls; WHERE
 * those come from is this interface. The dashboard plugs in the Supabase
 * implementation below; the public /demo plugs in the in-browser sandbox
 * backend, so the demo's agency pane is the real detail view, not a copy that
 * drifts from it.
 *
 * Sensitive Dependencies:
 * - Type-only for the demo: `src/components/demo/*` must import nothing but
 *   the types from here, or the Supabase client lands in the /demo bundle.
 *   The implementation is in `feedback-detail-supabase.ts` for that reason.
 */
import type { ReplyOriginMetadata, ReplyPinMetadata } from "@/lib/feedback-utils"

export interface DetailAttachment {
    id: string
    file_name: string
    file_url: string
    file_size: number
    mime_type: string
    uploaded_by?: string | null
}

export interface DetailReply {
    id: string
    content: string
    author_role: string
    author_name?: string | null
    created_at: string
    attachments?: DetailAttachment[]
    /** Present when the reply was pinned to a spot on the page from the widget. */
    metadata?: (ReplyPinMetadata & ReplyOriginMetadata) | null
}

export interface FeedbackDetailBackend {
    /** Who "I" am in the thread: replies by this author render on the right. */
    currentUserName(): Promise<string | null>
    fetchReplies(feedbackId: string): Promise<DetailReply[]>
    /** Report-level attachments only (reply attachments ride on the replies). */
    fetchAttachments(feedbackId: string): Promise<DetailAttachment[]>
    /** Live updates. `kind` says what may have changed; returns the unsubscribe. */
    subscribe(feedbackId: string, onChange: (kind: "replies" | "all") => void): () => void
    /** `uploadError` means the reply went out but its files did not. */
    sendReply(feedbackId: string, content: string, files: File[]): Promise<{ error?: string; uploadError?: string }>
    setStatus(feedbackId: string, status: string): Promise<{ error?: string }>
    deleteFeedback(feedbackId: string): Promise<{ error?: string }>
}
