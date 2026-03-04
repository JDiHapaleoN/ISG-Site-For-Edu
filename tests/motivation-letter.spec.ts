import { test, expect } from "@playwright/test";

test.describe("Motivation Letter API", () => {
    test("rejects missing required fields", async ({ request }) => {
        const response = await request.post("/api/practice/motivation-letter", {
            data: { language: "en" },
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.error || body.details).toBeTruthy();
    });

    test("rejects invalid language", async ({ request }) => {
        const response = await request.post("/api/practice/motivation-letter", {
            data: {
                language: "fr",
                fullName: "Test User",
                program: "CS",
                university: "MIT",
            },
        });
        expect(response.status()).toBe(400);
    });

    test("rejects overly long fields", async ({ request }) => {
        const response = await request.post("/api/practice/motivation-letter", {
            data: {
                language: "en",
                fullName: "A".repeat(300), // Exceeds 200 limit
                program: "CS",
                university: "MIT",
            },
        });
        expect(response.status()).toBe(400);
    });
});

test.describe("Rate Limiting", () => {
    test("AI endpoint returns 429 after exceeding limit", async ({ request }) => {
        // Fire 6 requests rapidly (limit is 5/min)
        const promises = Array.from({ length: 6 }, () =>
            request.post("/api/practice/motivation-letter", {
                data: {
                    language: "en",
                    fullName: "Rate Limit Test",
                    program: "CS",
                    university: "MIT",
                },
            })
        );

        const responses = await Promise.all(promises);
        const statuses = responses.map(r => r.status());
        // At least one should be 429
        expect(statuses).toContain(429);
    });
});
