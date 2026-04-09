import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
	closeTestDb,
	createHousehold,
	createMember,
	createUser,
	resetDb,
} from "../tests/fixtures";
import { createHouseholdForUser, getSession } from "./authService";

beforeEach(async () => {
	await resetDb();
});

afterAll(async () => {
	await closeTestDb();
});

describe("authService.getSession", () => {
	it("returns null when user has no household membership", async () => {
		const user = await createUser();

		const session = await getSession(user.id);

		expect(session).toBeNull();
	});

	it("returns session with correct userId, householdId, role", async () => {
		const user = await createUser();
		const household = await createHousehold();
		await createMember(user.id, household.id, "member");

		const session = await getSession(user.id);

		expect(session).not.toBeNull();
		expect(session?.userId).toBe(user.id);
		expect(session?.householdId).toBe(household.id);
		expect(session?.role).toBe("member");
	});

	it("returns role admin when member was created as admin", async () => {
		const user = await createUser();
		const household = await createHousehold();
		await createMember(user.id, household.id, "admin");

		const session = await getSession(user.id);

		expect(session?.role).toBe("admin");
	});
});

describe("authService.createHouseholdForUser", () => {
	it("creates a household with the given name", async () => {
		const user = await createUser();

		const { household } = await createHouseholdForUser(user.id, "My Home");

		expect(household.name).toBe("My Home");
	});

	it("inserts the user as an admin member", async () => {
		const user = await createUser();

		const { member } = await createHouseholdForUser(user.id, "My Home");

		expect(member.userId).toBe(user.id);
		expect(member.role).toBe("admin");
	});

	it("makes getSession work for the user afterwards", async () => {
		const user = await createUser();

		const { household } = await createHouseholdForUser(user.id, "My Home");
		const session = await getSession(user.id);

		expect(session).not.toBeNull();
		expect(session?.userId).toBe(user.id);
		expect(session?.householdId).toBe(household.id);
		expect(session?.role).toBe("admin");
	});
});
