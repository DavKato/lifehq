/**
 * Runs before any test module is loaded.
 * Provides env vars required by config/env.ts so the Zod parse succeeds.
 * OAuth values are stubs — they are never called in service-layer tests.
 */
process.env.DATABASE_URL ??=
	process.env.TEST_DATABASE_URL ??
	"postgresql://lifehq:dev@localhost:5432/lifehq";
process.env.GOOGLE_CLIENT_ID ??= "test-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-client-secret";
process.env.BETTER_AUTH_SECRET ??= "test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
