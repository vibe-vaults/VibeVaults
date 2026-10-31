/**
 * Main Responsibility: The dashboard's feedback detail — `FeedbackDetailView` wired to Supabase
 * (replies, attachments, Realtime) and the feedback server actions.
 *
 * Sensitive Dependencies:
 * - `createSupabaseFeedbackBackend()` (@/lib/feedback-detail-supabase) owns every read and write.
 * - Next.js Router for navigation after delete.
 */
'use client';

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FeedbackDetailView } from "./feedback-detail-view"
import { createSupabaseFeedbackBackend } from "@/lib/feedback-detail-supabase"
import { type FeedbackData } from "@/lib/feedback-utils"

interface FeedbackDetailProps {
    feedback: FeedbackData
    mode: 'view' | 'edit'
    senderAvatarUrl?: string
}

export function FeedbackDetail({ feedback, mode, senderAvatarUrl }: FeedbackDetailProps) {
    // Created once: the view re-subscribes whenever the backend's identity changes.
    const [backend] = useState(createSupabaseFeedbackBackend)
    const router = useRouter()

    return (
        <FeedbackDetailView
            feedback={feedback}
            mode={mode}
            senderAvatarUrl={senderAvatarUrl}
            backend={backend}
            onDeleted={() => router.push('/dashboard/feedback')}
        />
    )
}
