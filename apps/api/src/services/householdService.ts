import type { Session } from "@lifehq/shared";
import { householdMembers, user } from "@lifehq/shared/db/schema";
import { eq } from "drizzle-orm";
import { db } from "../db/client";

export async function getMembers(session: Session) {
	const members = await db
		.select({
			id: user.id,
			name: user.name,
			image: user.image,
		})
		.from(householdMembers)
		.innerJoin(user, eq(householdMembers.userId, user.id))
		.where(eq(householdMembers.householdId, session.householdId));

	return members;
}
