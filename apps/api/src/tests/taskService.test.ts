import { tasks } from "@lifehq/shared/db/schema";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { create, getAll, softDelete } from "../services/taskService";
import {
	closeTestDb,
	createHousehold,
	createMember,
	createUser,
	getTestDb,
	resetDb,
} from "./fixtures";

beforeEach(async () => {
	await resetDb();
});

afterAll(async () => {
	await closeTestDb();
});

describe("taskService.create", () => {
	it("sets createdBy from session.userId", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const task = await create(session, { title: "Buy groceries" });

		expect(task.createdBy).toBe(user.id);
		expect(task.title).toBe("Buy groceries");
		expect(task.householdId).toBe(household.id);
	});

	it("sets householdId from session", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const task = await create(session, { title: "Take out trash" });

		expect(task.householdId).toBe(household.id);
	});
});

describe("taskService.getAll", () => {
	it("only returns tasks from the session household", async () => {
		const userA = await createUser({ email: "a@test.local" });
		const userB = await createUser({ email: "b@test.local" });
		const householdA = await createHousehold("Household A");
		const householdB = await createHousehold("Household B");
		const sessionA = await createMember(userA.id, householdA.id);
		const sessionB = await createMember(userB.id, householdB.id);

		await create(sessionA, { title: "Task in A" });
		await create(sessionB, { title: "Task in B" });

		const resultA = await getAll(sessionA);
		expect(resultA.tasks).toHaveLength(1);
		expect(resultA.tasks[0].title).toBe("Task in A");

		const resultB = await getAll(sessionB);
		expect(resultB.tasks).toHaveLength(1);
		expect(resultB.tasks[0].title).toBe("Task in B");
	});

	it("excludes soft-deleted tasks", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const task = await create(session, { title: "To be deleted" });
		await create(session, { title: "Active task" });

		const db = getTestDb();
		await db
			.update(tasks)
			.set({ deletedAt: new Date() })
			.where(eq(tasks.id, task.id));

		const result = await getAll(session);
		expect(result.tasks).toHaveLength(1);
		expect(result.tasks[0].title).toBe("Active task");
	});

	it("sorts by dueDate ascending with nulls last", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const db = getTestDb();
		await db.insert(tasks).values({
			title: "Due later",
			dueDate: "2026-06-01",
			householdId: household.id,
			createdBy: user.id,
		});
		await db.insert(tasks).values({
			title: "Due sooner",
			dueDate: "2026-04-10",
			householdId: household.id,
			createdBy: user.id,
		});
		await db.insert(tasks).values({
			title: "No due date",
			dueDate: null,
			householdId: household.id,
			createdBy: user.id,
		});

		const result = await getAll(session);
		expect(result.tasks.map((t) => t.title)).toEqual([
			"Due sooner",
			"Due later",
			"No due date",
		]);
	});
});

describe("taskService.softDelete", () => {
	it("soft-deletes a task within the household", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const task = await create(session, { title: "To delete" });
		await softDelete(session, { id: task.id });

		const result = await getAll(session);
		expect(result.tasks).toHaveLength(0);
	});

	it("cannot soft-delete a task from another household", async () => {
		const userA = await createUser({ email: "a@test.local" });
		const userB = await createUser({ email: "b@test.local" });
		const householdA = await createHousehold("A");
		const householdB = await createHousehold("B");
		const sessionA = await createMember(userA.id, householdA.id);
		const sessionB = await createMember(userB.id, householdB.id);

		const task = await create(sessionA, { title: "Household A task" });
		const result = await softDelete(sessionB, { id: task.id });
		expect(result).toBeNull();

		const resultA = await getAll(sessionA);
		expect(resultA.tasks).toHaveLength(1);
	});
});

describe("taskService.getAll pagination", () => {
	it("returns correct page size and total", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		for (let i = 1; i <= 5; i++) {
			await create(session, { title: `Task ${i}` });
		}

		const page1 = await getAll(session, { page: 1, limit: 2 });
		expect(page1.tasks).toHaveLength(2);
		expect(page1.total).toBe(5);
		expect(page1.totalPages).toBe(3);
		expect(page1.page).toBe(1);

		const page3 = await getAll(session, { page: 3, limit: 2 });
		expect(page3.tasks).toHaveLength(1);
	});
});
