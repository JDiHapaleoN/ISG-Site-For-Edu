import { test, expect } from "@playwright/test";

test.describe("SRS Review Flow", () => {
    // These tests verify the review page structure without auth
    // (will redirect to login, but tests page existence)

    test("review page redirects unauthenticated users to login", async ({ page }) => {
        await page.goto("/review?lang=german");
        await expect(page).toHaveURL(/\/login/);
    });

    test("review page with english module redirects to login", async ({ page }) => {
        await page.goto("/review?lang=english");
        await expect(page).toHaveURL(/\/login/);
    });
});

test.describe("SRS API Validation", () => {
    test("srs/due rejects invalid module", async ({ request }) => {
        const response = await request.get("/api/srs/due?module=french");
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.error).toContain("Invalid module");
    });

    test("srs/review rejects invalid payload", async ({ request }) => {
        const response = await request.post("/api/srs/review", {
            data: { wordId: "not-a-uuid", quality: 99, module: "klingon" },
        });
        expect(response.status()).toBe(400);
    });

    test("srs/add rejects missing data", async ({ request }) => {
        const response = await request.post("/api/srs/add", {
            data: {},
        });
        expect(response.status()).toBe(400);
    });
});
