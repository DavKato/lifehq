import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
	closeTestDb,
	createHousehold,
	createMember,
	createUser,
	resetDb,
} from "../tests/fixtures";
import { getMembers } from "./householdService";

beforeEach(async () => {
	await resetDb();
});

afterAll(async () => {
	await closeTestDb();
});

describe("householdService.getMembers", () => {
	it("returns id, name, image for each member of the session household", async () => {
		const user = await createUser({
			name: "Alice",
			image: "https://example.com/alice.png",
		});
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const members = await getMembers(session);

		expect(members).toHaveLength(1);
		expect(members[0]).toMatchObject({
			id: user.id,
			name: "Alice",
			image: "https://example.com/alice.png",
		});
	});

	it("excludes members from other households", async () => {
		const userA = await createUser({ email: "a@test.local" });
		const userB = await createUser({ email: "b@test.local" });
		const householdA = await createHousehold("A");
		const householdB = await createHousehold("B");
		const sessionA = await createMember(userA.id, householdA.id);
		await createMember(userB.id, householdB.id);

		const members = await getMembers(sessionA);

		expect(members).toHaveLength(1);
		expect(members[0].id).toBe(userA.id);
	});

	it("does not expose email or other private user fields", async () => {
		const user = await createUser({ email: "secret@test.local" });
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const members = await getMembers(session);

		expect(members[0]).not.toHaveProperty("email");
		expect(members[0]).not.toHaveProperty("emailVerified");
		expect(members[0]).not.toHaveProperty("createdAt");
		expect(Object.keys(members[0])).toEqual(["id", "name", "image"]);
	});

	it("returns all members when household has multiple", async () => {
		const userA = await createUser({ email: "a@test.local" });
		const userB = await createUser({ email: "b@test.local" });
		const household = await createHousehold();
		const session = await createMember(userA.id, household.id);
		await createMember(userB.id, household.id);

		const members = await getMembers(session);

		expect(members).toHaveLength(2);
		const ids = members.map((m) => m.id);
		expect(ids).toContain(userA.id);
		expect(ids).toContain(userB.id);
	});
});
