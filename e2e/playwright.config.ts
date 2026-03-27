import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({ path: resolve(import.meta.dirname, "../.env"), quiet: true });

export default defineConfig({
	testDir: "./tests",
	use: {
		baseURL: "http://localhost:3000",
	},
	globalSetup: "./global-setup.ts",
	globalTeardown: "./global-teardown.ts",
});
