import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.string(),
	PORT: z.string().optional(),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	BETTER_AUTH_SECRET: z.string(),
	BETTER_AUTH_URL: z.string(),
	BETTER_AUTH_TRUSTED_HOSTS: z.string().optional(),
	CORS_ORIGINS: z.string().optional(),
});

export const config = envSchema.parse(process.env);
