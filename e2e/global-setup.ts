import postgres from "postgres";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

export const TEST_TOKEN = "test-token-playwright-e2e";
export const AUTH_STATE_FILE = ".auth/session.json";

async function signCookie(value: string): Promise<string> {
	const secret = process.env.BETTER_AUTH_SECRET!;
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(value),
	);
	return `${value}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
}

export default async function globalSetup() {
	const sql = postgres(process.env.DATABASE_URL!);

	await sql`
		INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
		VALUES ('test-user-1', 'Test User', 'test@lifehq.dev', true, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING
	`;
	await sql`
		INSERT INTO households (id, name, created_at)
		VALUES ('00000000-0000-0000-0000-000000000001', 'Test Household', NOW())
		ON CONFLICT (id) DO NOTHING
	`;
	await sql`
		INSERT INTO household_members (id, user_id, household_id, role, created_at)
		VALUES ('00000000-0000-0000-0000-000000000002', 'test-user-1', '00000000-0000-0000-0000-000000000001', 'admin', NOW())
		ON CONFLICT (id) DO NOTHING
	`;
	await sql`
		INSERT INTO session (id, token, expires_at, created_at, updated_at, user_id)
		VALUES ('test-session-1', ${TEST_TOKEN}, NOW() + INTERVAL '1 day', NOW(), NOW(), 'test-user-1')
		ON CONFLICT (id) DO NOTHING
	`;

	await sql.end();

	const signedValue = await signCookie(TEST_TOKEN);
	mkdirSync(resolve(import.meta.dirname, ".auth"), { recursive: true });
	writeFileSync(
		resolve(import.meta.dirname, AUTH_STATE_FILE),
		JSON.stringify({
			cookies: [
				{
					name: "better-auth.session_token",
					value: signedValue,
					domain: "localhost",
					path: "/",
					expires: -1,
					httpOnly: true,
					secure: false,
					sameSite: "Lax",
				},
			],
			origins: [],
		}),
	);
}
