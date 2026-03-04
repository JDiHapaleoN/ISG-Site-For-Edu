import { z } from "zod";

// ─── SRS Review ───
export const srsReviewSchema = z.object({
    wordId: z.string().uuid("wordId must be a valid UUID"),
    quality: z.number().int().min(0).max(5),
    module: z.enum(["english", "german"]),
    idempotencyKey: z.string().uuid().optional(),
});

// ─── SRS Add Word ───
const baseWordSchema = z.object({
    term: z.string().min(1, "Term is required").max(200),
    translation: z.string().max(500).optional().nullable(),
    context: z.string().max(2000).optional().nullable(),
    contextTranslation: z.string().max(2000).optional().nullable(),
    mnemonic: z.string().max(1000).optional().nullable(),
    partOfSpeech: z.string().max(50).optional().nullable(),
});

export const englishWordSchema = baseWordSchema.extend({
    transcription: z.string().max(100).optional().nullable(),
});

export const germanWordSchema = baseWordSchema.extend({
    article: z.string().max(10).optional().nullable(),
    pluralForm: z.string().max(100).optional().nullable(),
});

export const srsAddSchema = z.object({
    module: z.enum(["english", "german"]),
    wordData: baseWordSchema, // Refined per-module in the route handler
});

// ─── SRS Due (query param) ───
export const srsDueModuleSchema = z.enum(["english", "german"]);

// ─── Motivation Letter ───
export const motivationLetterSchema = z.object({
    language: z.enum(["en", "de"]),
    fullName: z.string().min(1, "Name is required").max(200),
    program: z.string().min(1, "Program is required").max(300),
    university: z.string().min(1, "University is required").max(300),
    country: z.string().max(200).optional().default(""),
    dateOfBirth: z.string().max(50).optional().default(""),
    currentEducation: z.string().max(500).optional().default(""),
    degree: z.string().max(100).optional().default(""),
    semester: z.string().max(50).optional().default(""),
    gpa: z.string().max(50).optional().default(""),
    strongSubjects: z.string().max(1000).optional().default(""),
    achievements: z.string().max(2000).optional().default(""),
    workExperience: z.string().max(2000).optional().default(""),
    languages: z.string().max(500).optional().default(""),
    whyProgram: z.string().max(2000).optional().default(""),
    whyCountry: z.string().max(2000).optional().default(""),
    careerGoals: z.string().max(2000).optional().default(""),
    hobbies: z.string().max(1000).optional().default(""),
    softSkills: z.string().max(1000).optional().default(""),
    additionalInfo: z.string().max(2000).optional().default(""),
});

// ─── Organizer Tasks ───
export const organizerTaskCreateSchema = z.object({
    text: z.string().min(1, "Task text is required").max(500),
    priority: z.enum(["high", "medium", "low"]).default("medium"),
    deadline: z.string().datetime().nullable().optional(),
});

export const organizerTaskPatchSchema = z.object({
    id: z.string().uuid("Task ID must be a valid UUID"),
    completed: z.boolean().optional(),
    priority: z.enum(["high", "medium", "low"]).optional(),
    deadline: z.string().datetime().nullable().optional(),
});

export const organizerTaskDeleteSchema = z.object({
    id: z.string().uuid("Task ID must be a valid UUID"),
});
