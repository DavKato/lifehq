import type { Session } from "@lifehq/shared";
import * as schema from "@lifehq/shared/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString =
	process.env.TEST_DATABASE_URL ??
	process.env.DATABASE_URL ??
	"postgresql://lifehq:dev@localhost:5432/lifehq";

let client: ReturnType<typeof postgres> | null = null;
let testDb: ReturnType<typeof drizzle> | null = null;

export function getTestDb() {
	if (!testDb) {
		client = postgres(connectionString, { max: 5 });
		testDb = drizzle(client, { schema });
	}
	return testDb;
}

export async function closeTestDb() {
	if (client) {
		await client.end();
		client = null;
		testDb = null;
	}
}

export async function resetDb() {
	const db = getTestDb();
	await db.execute(
		`TRUNCATE TABLE tasks, subscriptions, household_members, household_invites, households, "user" CASCADE`,
	);
}

export async function createUser(
	overrides: Partial<typeof schema.user.$inferInsert> = {},
) {
	const db = getTestDb();
	const id = crypto.randomUUID();
	const [u] = await db
		.insert(schema.user)
		.values({
			id,
			name: "Test User",
			email: `user-${id}@test.local`,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			...overrides,
		})
		.returning();
	return u;
}

export async function createHousehold(name = "Test Household") {
	const db = getTestDb();
	const [h] = await db.insert(schema.households).values({ name }).returning();
	return h;
}

export async function createMember(
	userId: string,
	householdId: string,
	role: Session["role"] = "member",
): Promise<Session> {
	const db = getTestDb();
	await db
		.insert(schema.householdMembers)
		.values({ userId, householdId, role });
	return { userId, householdId, role };
}
