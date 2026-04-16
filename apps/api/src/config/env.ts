import { z } from "zod";

// dbConfig and appConfig MUST remain separate schemas.
// In CI, db:migrate runs with only DATABASE_URL available — the auth vars
// (GOOGLE_CLIENT_ID etc.) are SSM SecureStrings injected at Lambda runtime only.
// Merging these into a single schema would break the migration step in the deploy workflow.

export const dbConfig = z
	.object({ DATABASE_URL: z.string() })
	.parse(process.env);

export const appConfig = z
	.object({
		PORT: z.string().optional(),
		GOOGLE_CLIENT_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
		BETTER_AUTH_SECRET: z.string(),
		BETTER_AUTH_URL: z.string(),
		BETTER_AUTH_TRUSTED_HOSTS: z.string().optional(),
		CORS_ORIGINS: z.string().optional(),
	})
	.parse(process.env);

export const config = { ...dbConfig, ...appConfig };
