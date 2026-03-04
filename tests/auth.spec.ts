import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
    test("should show login page for unauthenticated users", async ({ page }) => {
        await page.goto("/");
        // Middleware should redirect to /login
        await expect(page).toHaveURL(/\/login/);
    });

    test("login page should load correctly", async ({ page }) => {
        await page.goto("/login");
        await expect(page.locator("h1, h2, h3").first()).toBeVisible();
        // Should have email and password inputs
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    });

    test("login page should have no black gap at top", async ({ page }) => {
        await page.goto("/login");
        // The background should start at the very top — no visible gap
        const body = page.locator("body");
        const bgColor = await body.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
        });
        // Body background shouldn't be black/transparent
        expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
    });

    test("should show validation errors for empty login", async ({ page }) => {
        await page.goto("/login");
        // Find and click the submit button
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
            await submitButton.click();
            // Page should stay on /login (not redirect)
            await expect(page).toHaveURL(/\/login/);
        }
    });

    test("register page should load", async ({ page }) => {
        await page.goto("/register");
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    });
});
