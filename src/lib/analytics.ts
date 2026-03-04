import { prisma } from "./prisma";

/**
 * Lightweight server-side analytics helper.
 * Fire-and-forget: errors are logged but never thrown.
 */
export async function trackEvent(
    event: string,
    userId?: string | null,
    metadata?: Record<string, any>
): Promise<void> {
    try {
        await prisma.analyticsEvent.create({
            data: {
                event,
                userId: userId ?? undefined,
                metadata: metadata ?? undefined,
            },
        });
    } catch (error) {
        console.error("[Analytics] Failed to track event:", event, error);
    }
}

// ─── Event Name Constants ───

export const EVENTS = {
    // SRS
    SRS_CARD_REVIEWED: "srs_card_reviewed",
    SRS_SESSION_COMPLETE: "srs_session_complete",
    SRS_WORD_ADDED: "srs_word_added",
    SRS_WORD_REQUEUED: "srs_word_requeued",

    // AI Practice
    WIZARD_STARTED: "wizard_started",
    WIZARD_COMPLETED: "wizard_completed",
    WIZARD_DROPPED: "wizard_dropped",
    WRITING_SUBMITTED: "writing_submitted",
    FEYNMAN_SUBMITTED: "feynman_submitted",

    // Translation
    WORD_TRANSLATED: "word_translated",

    // Auth
    USER_LOGIN: "user_login",
    USER_REGISTER: "user_register",
} as const;
