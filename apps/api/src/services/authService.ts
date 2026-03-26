import type { Session } from "@lifehq/shared";
import { householdMembers, households } from "@lifehq/shared/db/schema";
import { eq } from "drizzle-orm";
import { db } from "../db/client";

export async function getSession(userId: string): Promise<Session | null> {
	const membership = await db.query.householdMembers.findFirst({
		where: eq(householdMembers.userId, userId),
		with: {
			user: true,
			household: true,
		},
	});

	if (!membership) {
		return null;
	}

	return {
		userId: membership.userId,
		householdId: membership.householdId,
		role: membership.role as "admin" | "member",
	};
}

export async function createHouseholdForUser(
	userId: string,
	name: string,
): Promise<{
	household: typeof households.$inferSelect;
	member: typeof householdMembers.$inferSelect;
}> {
	const [household] = await db
		.insert(households)
		.values({ name })
		.returning();

	const [member] = await db
		.insert(householdMembers)
		.values({
			userId,
			householdId: household.id,
			role: "admin",
		})
		.returning();

	return { household, member };
}
