import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

const authStateFile = resolve(import.meta.dirname, "../.auth/session.json");

test.describe("unauthenticated", () => {
	test("/ redirects to /login", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL("/login");
	});

	test("/dashboard redirects to /login", async ({ page }) => {
		await page.goto("/dashboard");
		await expect(page).toHaveURL("/login");
	});
});

test.describe("authenticated", () => {
	test.use({ storageState: authStateFile });

	test("/ redirects to /dashboard", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL("/dashboard");
	});

	test("/dashboard renders dashboard page", async ({ page }) => {
		await page.goto("/dashboard");
		await expect(page).toHaveURL("/dashboard");
		await expect(
			page.getByRole("heading", { name: "Dashboard" }),
		).toBeVisible();
	});
});
