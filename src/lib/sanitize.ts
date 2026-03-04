/**
 * Sanitize user-provided text before interpolating into LLM prompts.
 * Strips control characters, excessive whitespace, and common prompt injection patterns.
 */
export function sanitizeForLlm(text: string | undefined | null): string {
    if (!text) return "";

    let sanitized = text;

    // 1. Remove control characters (except newlines and tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // 2. Collapse excessive whitespace (>3 newlines → 2, >3 spaces → 1)
    sanitized = sanitized.replace(/\n{4,}/g, "\n\n\n");
    sanitized = sanitized.replace(/ {4,}/g, " ");

    // 3. Strip common prompt injection patterns
    const injectionPatterns = [
        /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
        /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
        /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
        /you\s+are\s+now\s+(a|an)\s+/gi,
        /system\s*:\s*/gi,
        /\[INST\]/gi,
        /\[\/INST\]/gi,
        /<\|im_start\|>/gi,
        /<\|im_end\|>/gi,
    ];

    for (const pattern of injectionPatterns) {
        sanitized = sanitized.replace(pattern, "[filtered]");
    }

    // 4. Truncate to 5000 characters max (safety net)
    if (sanitized.length > 5000) {
        sanitized = sanitized.slice(0, 5000) + "...";
    }

    return sanitized.trim();
}
