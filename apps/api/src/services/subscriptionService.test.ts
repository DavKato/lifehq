import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
	closeTestDb,
	createCategory,
	createHousehold,
	createMember,
	createUser,
	resetDb,
} from "../tests/fixtures";
import {
	create,
	getAll,
	getAllCategories,
	getAnalytics,
	getById,
	remove,
	update,
} from "./subscriptionService";

const BASE_INPUT = {
	name: "Netflix",
	price: 9.99,
	billingCycle: "monthly" as const,
	renewalDate: "2026-05-01",
};

beforeEach(async () => {
	await resetDb();
});

afterAll(async () => {
	await closeTestDb();
});

describe("subscriptionService.create", () => {
	it("sets householdId from session", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const sub = await create(session, BASE_INPUT);

		expect(sub.householdId).toBe(household.id);
	});

	it("price is preserved with correct decimal precision", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const sub = await create(session, { ...BASE_INPUT, price: 9.99 });

		expect(parseFloat(sub.price)).toBeCloseTo(9.99);
	});

	it("sets categoryId to null when not provided", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const sub = await create(session, BASE_INPUT);

		expect(sub.categoryId).toBeNull();
	});

	it("sets categoryId when provided", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);
		const category = await createCategory("Streaming");

		const sub = await create(session, {
			...BASE_INPUT,
			categoryId: category.id,
		});

		expect(sub.categoryId).toBe(category.id);
	});
});

describe("subscriptionService.getAll", () => {
	it("returns only subscriptions for session household", async () => {
		const userA = await createUser({ email: "a@test.local" });
		const userB = await createUser({ email: "b@test.local" });
		const householdA = await createHousehold("A");
		const householdB = await createHousehold("B");
		const sessionA = await createMember(userA.id, householdA.id);
		const sessionB = await createMember(userB.id, householdB.id);

		await create(sessionA, { ...BASE_INPUT, name: "Sub A" });
		await create(sessionB, { ...BASE_INPUT, name: "Sub B" });

		const result = await getAll(sessionA);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("Sub A");
	});

	it("excludes soft-deleted subscriptions", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const sub = await create(session, { ...BASE_INPUT, name: "To delete" });
		await create(session, { ...BASE_INPUT, name: "Active" });

		await remove(session, sub.id);

		const result = await getAll(session);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("Active");
	});

	it("includes category relation when categoryId is set", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);
		const category = await createCategory("Streaming");

		await create(session, { ...BASE_INPUT, categoryId: category.id });

		const result = await getAll(session);
		expect(result[0].category).toMatchObject({
			id: category.id,
			name: "Streaming",
		});
	});

	it("category is null when categoryId is not set", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		await create(session, BASE_INPUT);

		const result = await getAll(session);
		expect(result[0].category).toBeNull();
	});

	it("orders by createdAt descending", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		await create(session, { ...BASE_INPUT, name: "First" });
		await create(session, { ...BASE_INPUT, name: "Second" });

		const result = await getAll(session);
		expect(result[0].name).toBe("Second");
		expect(result[1].name).toBe("First");
	});
});

describe("subscriptionService.getById", () => {
	it("returns subscription by id within the same household", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const sub = await create(session, BASE_INPUT);
		const found = await getById(session, sub.id);

		expect(found?.id).toBe(sub.id);
	});

	it("returns undefined for wrong household", async () => {
		const userA = await createUser({ email: "a@test.local" });
		const userB = await createUser({ email: "b@test.local" });
		const householdA = await createHousehold("A");
		const householdB = await createHousehold("B");
		const sessionA = await createMember(userA.id, householdA.id);
		const sessionB = await createMember(userB.id, householdB.id);

		const sub = await create(sessionA, BASE_INPUT);
		const found = await getById(sessionB, sub.id);

		expect(found).toBeUndefined();
	});

	it("returns undefined when soft-deleted", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const sub = await create(session, BASE_INPUT);
		await remove(session, sub.id);

		const found = await getById(session, sub.id);
		expect(found).toBeUndefined();
	});
});

describe("subscriptionService.update", () => {
	it("updates provided fields", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const sub = await create(session, BASE_INPUT);
		const updated = await update(session, sub.id, {
			name: "Disney+",
			price: 7.99,
			billingCycle: "yearly",
			renewalDate: "2027-01-01",
		});

		expect(updated?.name).toBe("Disney+");
		expect(parseFloat(updated?.price ?? "0")).toBeCloseTo(7.99);
		expect(updated?.billingCycle).toBe("yearly");
		expect(updated?.renewalDate).toBe("2027-01-01");
	});

	it("partial update leaves unspecified fields unchanged", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const sub = await create(session, {
			...BASE_INPUT,
			name: "Spotify",
			renewalDate: "2026-06-15",
		});
		const updated = await update(session, sub.id, {
			name: "Spotify Premium",
		});

		expect(updated?.name).toBe("Spotify Premium");
		expect(updated?.renewalDate).toBe("2026-06-15");
	});

	it("returns undefined when subscription belongs to another household", async () => {
		const userA = await createUser({ email: "a@test.local" });
		const userB = await createUser({ email: "b@test.local" });
		const householdA = await createHousehold("A");
		const householdB = await createHousehold("B");
		const sessionA = await createMember(userA.id, householdA.id);
		const sessionB = await createMember(userB.id, householdB.id);

		const sub = await create(sessionA, BASE_INPUT);
		const result = await update(sessionB, sub.id, { name: "Hijacked" });

		expect(result).toBeUndefined();
		const original = await getById(sessionA, sub.id);
		expect(original?.name).toBe("Netflix");
	});

	it("returns undefined when subscription is soft-deleted", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const sub = await create(session, BASE_INPUT);
		await remove(session, sub.id);

		const result = await update(session, sub.id, { name: "New name" });
		expect(result).toBeUndefined();
	});

	it("refreshes updatedAt on update", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const sub = await create(session, BASE_INPUT);
		const before = sub.updatedAt;

		await new Promise((r) => setTimeout(r, 10));
		const updated = await update(session, sub.id, { name: "Updated" });

		expect(updated?.updatedAt.getTime()).toBeGreaterThan(before.getTime());
	});
});

describe("subscriptionService.remove", () => {
	it("soft-deletes so subscription no longer appears in getAll", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const sub = await create(session, BASE_INPUT);
		await remove(session, sub.id);

		const result = await getAll(session);
		expect(result).toHaveLength(0);
	});

	it("does not delete subscription from another household", async () => {
		const userA = await createUser({ email: "a@test.local" });
		const userB = await createUser({ email: "b@test.local" });
		const householdA = await createHousehold("A");
		const householdB = await createHousehold("B");
		const sessionA = await createMember(userA.id, householdA.id);
		const sessionB = await createMember(userB.id, householdB.id);

		const sub = await create(sessionA, BASE_INPUT);
		await remove(sessionB, sub.id);

		const result = await getAll(sessionA);
		expect(result).toHaveLength(1);
	});
});

describe("subscriptionService.getAnalytics", () => {
	it("returns zero totals when no subscriptions", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const analytics = await getAnalytics(session);

		expect(analytics.totalMonthly).toBe(0);
		expect(analytics.totalYearly).toBe(0);
		expect(analytics.byCategory).toHaveLength(0);
	});

	it("totalMonthly sums monthly subscriptions at face value", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		await create(session, {
			...BASE_INPUT,
			price: 10,
			billingCycle: "monthly",
		});
		await create(session, {
			...BASE_INPUT,
			price: 5,
			billingCycle: "monthly",
			name: "Spotify",
		});

		const analytics = await getAnalytics(session);

		expect(analytics.totalMonthly).toBeCloseTo(15);
	});

	it("totalMonthly includes yearly subscriptions at price/12", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		await create(session, {
			...BASE_INPUT,
			price: 120,
			billingCycle: "yearly",
		});

		const analytics = await getAnalytics(session);

		expect(analytics.totalMonthly).toBeCloseTo(10);
	});

	it("totalYearly equals totalMonthly * 12", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		await create(session, {
			...BASE_INPUT,
			price: 10,
			billingCycle: "monthly",
		});

		const analytics = await getAnalytics(session);

		expect(analytics.totalYearly).toBeCloseTo(analytics.totalMonthly * 12);
	});

	it("groups byCategory with categoryId and categoryName", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);
		const category = await createCategory("Entertainment");

		await create(session, {
			...BASE_INPUT,
			price: 10,
			categoryId: category.id,
		});
		await create(session, {
			...BASE_INPUT,
			price: 5,
			name: "Spotify",
			categoryId: category.id,
		});

		const analytics = await getAnalytics(session);

		expect(analytics.byCategory).toHaveLength(1);
		expect(analytics.byCategory[0].categoryId).toBe(category.id);
		expect(analytics.byCategory[0].categoryName).toBe("Entertainment");
		expect(parseFloat(analytics.byCategory[0].totalMonthly)).toBeCloseTo(
			15,
		);
	});
});

describe("subscriptionService.getAllCategories", () => {
	it("returns all categories sorted by name ascending", async () => {
		await createCategory("Streaming");
		await createCategory("Fitness");
		await createCategory("News");

		const result = await getAllCategories();

		expect(result.map((c) => c.name)).toEqual([
			"Fitness",
			"News",
			"Streaming",
		]);
	});
});
