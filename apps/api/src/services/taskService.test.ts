import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
	closeTestDb,
	createHousehold,
	createMember,
	createUser,
	resetDb,
} from "../tests/fixtures";
import {
	complete,
	create,
	getAll,
	softDelete,
	uncomplete,
	update,
} from "./taskService";

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

		await softDelete(session, { id: task.id });

		const result = await getAll(session);
		expect(result.tasks).toHaveLength(1);
		expect(result.tasks[0].title).toBe("Active task");
	});

	describe("pagination", () => {
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

	describe("filtering", () => {
		it("filters by status: incomplete excludes completed tasks", async () => {
			const user = await createUser();
			const household = await createHousehold();
			const session = await createMember(user.id, household.id);

			const t1 = await create(session, { title: "Incomplete" });
			const t2 = await create(session, { title: "Completed" });
			await complete(session, { id: t2.id });

			const result = await getAll(session, { status: "incomplete" });
			expect(result.tasks).toHaveLength(1);
			expect(result.tasks[0].id).toBe(t1.id);
		});

		it("filters by status: completed returns only completed tasks", async () => {
			const user = await createUser();
			const household = await createHousehold();
			const session = await createMember(user.id, household.id);

			await create(session, { title: "Incomplete" });
			const t2 = await create(session, { title: "Completed" });
			await complete(session, { id: t2.id });

			const result = await getAll(session, { status: "completed" });
			expect(result.tasks).toHaveLength(1);
			expect(result.tasks[0].id).toBe(t2.id);
		});

		it("filters by assigneeId: specific user", async () => {
			const userA = await createUser({ email: "a@test.local" });
			const userB = await createUser({ email: "b@test.local" });
			const household = await createHousehold();
			const sessionA = await createMember(userA.id, household.id);
			await createMember(userB.id, household.id);

			const t1 = await create(sessionA, { title: "Assigned to A" });
			await update(sessionA, { id: t1.id, assignedTo: userA.id });
			await create(sessionA, { title: "Unassigned" });

			const result = await getAll(sessionA, { assigneeId: userA.id });
			expect(result.tasks).toHaveLength(1);
			expect(result.tasks[0].id).toBe(t1.id);
		});

		it("filters by assigneeId: unassigned", async () => {
			const userA = await createUser({ email: "a@test.local" });
			const household = await createHousehold();
			const sessionA = await createMember(userA.id, household.id);

			const t1 = await create(sessionA, { title: "Assigned" });
			await update(sessionA, { id: t1.id, assignedTo: userA.id });
			const t2 = await create(sessionA, { title: "Unassigned" });

			const result = await getAll(sessionA, { assigneeId: "unassigned" });
			expect(result.tasks).toHaveLength(1);
			expect(result.tasks[0].id).toBe(t2.id);
		});

		it("combined filter: status + assigneeId", async () => {
			const userA = await createUser({ email: "a@test.local" });
			const household = await createHousehold();
			const sessionA = await createMember(userA.id, household.id);

			const t1 = await create(sessionA, { title: "A incomplete" });
			await update(sessionA, { id: t1.id, assignedTo: userA.id });
			const t2 = await create(sessionA, { title: "A completed" });
			await update(sessionA, { id: t2.id, assignedTo: userA.id });
			await complete(sessionA, { id: t2.id });
			await create(sessionA, { title: "Unassigned incomplete" });

			const result = await getAll(sessionA, {
				assigneeId: userA.id,
				status: "incomplete",
			});
			expect(result.tasks).toHaveLength(1);
			expect(result.tasks[0].id).toBe(t1.id);
		});
	});

	describe("sort order", () => {
		it("sorts by dueDate ascending with nulls last", async () => {
			const user = await createUser();
			const household = await createHousehold();
			const session = await createMember(user.id, household.id);

			const t1 = await create(session, { title: "Due later" });
			await update(session, { id: t1.id, dueDate: "2026-06-01" });
			const t2 = await create(session, { title: "Due sooner" });
			await update(session, { id: t2.id, dueDate: "2026-04-10" });
			await create(session, { title: "No due date" });

			const result = await getAll(session);
			expect(result.tasks.map((t) => t.title)).toEqual([
				"Due sooner",
				"Due later",
				"No due date",
			]);
		});

		it("sorts by completedAt descending when status=completed", async () => {
			const user = await createUser();
			const household = await createHousehold();
			const session = await createMember(user.id, household.id);

			const t1 = await create(session, { title: "First completed" });
			const t2 = await create(session, { title: "Second completed" });

			await complete(session, { id: t1.id });
			// Small delay to ensure different timestamps
			await new Promise((r) => setTimeout(r, 10));
			await complete(session, { id: t2.id });

			const result = await getAll(session, { status: "completed" });
			expect(result.tasks[0].id).toBe(t2.id); // most recent first
			expect(result.tasks[1].id).toBe(t1.id);
		});
	});

	describe("response shape", () => {
		it("includes assignee and creator relation fields", async () => {
			const user = await createUser({ email: "creator@test.local" });
			const assignee = await createUser({ email: "assignee@test.local" });
			const household = await createHousehold();
			const session = await createMember(user.id, household.id);
			await createMember(assignee.id, household.id);

			const task = await create(session, { title: "With relations" });
			await update(session, { id: task.id, assignedTo: assignee.id });

			const result = await getAll(session);
			const row = result.tasks[0];

			expect(row.creator).toMatchObject({
				id: user.id,
				name: expect.any(String),
			});
			expect(row.assignee).toMatchObject({
				id: assignee.id,
				name: expect.any(String),
			});
		});

		it("assignee is null when task is unassigned", async () => {
			const user = await createUser();
			const household = await createHousehold();
			const session = await createMember(user.id, household.id);

			await create(session, { title: "Unassigned" });

			const result = await getAll(session);
			expect(result.tasks[0].assignee).toBeNull();
		});
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

	it("returns null when task is already soft-deleted", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const task = await create(session, { title: "Delete me" });
		await softDelete(session, { id: task.id });

		const result = await softDelete(session, { id: task.id });
		expect(result).toBeNull();
	});
});

describe("taskService.complete / uncomplete", () => {
	it("complete sets completedAt to a timestamp", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const task = await create(session, { title: "Finish laundry" });
		expect(task.completedAt).toBeNull();

		const updated = await complete(session, { id: task.id });
		expect(updated?.completedAt).not.toBeNull();
	});

	it("uncomplete clears completedAt to null", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const task = await create(session, { title: "Mow lawn" });
		await complete(session, { id: task.id });
		const uncompleted = await uncomplete(session, { id: task.id });
		expect(uncompleted?.completedAt).toBeNull();
	});

	it("cannot complete a task from another household", async () => {
		const userA = await createUser({ email: "a@test.local" });
		const userB = await createUser({ email: "b@test.local" });
		const householdA = await createHousehold("A");
		const householdB = await createHousehold("B");
		const sessionA = await createMember(userA.id, householdA.id);
		const sessionB = await createMember(userB.id, householdB.id);

		const task = await create(sessionA, { title: "Household A task" });
		const result = await complete(sessionB, { id: task.id });
		expect(result).toBeNull();

		const tasks = await getAll(sessionA);
		expect(tasks.tasks[0].completedAt).toBeNull();
	});

	it("returns null when task is soft-deleted", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const task = await create(session, { title: "Deleted task" });
		await softDelete(session, { id: task.id });

		const result = await complete(session, { id: task.id });
		expect(result).toBeNull();
	});
});

describe("taskService.update", () => {
	it("updates title, description, dueDate, and assignedTo", async () => {
		const userA = await createUser({ email: "a@test.local" });
		const userB = await createUser({ email: "b@test.local" });
		const household = await createHousehold();
		const session = await createMember(userA.id, household.id);
		await createMember(userB.id, household.id);

		const task = await create(session, { title: "Original" });

		const updated = await update(session, {
			id: task.id,
			title: "Updated",
			description: "Some details",
			dueDate: "2026-12-01",
			assignedTo: userB.id,
		});

		expect(updated?.title).toBe("Updated");
		expect(updated?.description).toBe("Some details");
		expect(updated?.dueDate).toBe("2026-12-01");
		expect(updated?.assignedTo).toBe(userB.id);
	});

	it("supports partial updates — unspecified fields are unchanged", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const task = await create(session, { title: "Buy milk" });
		await update(session, {
			id: task.id,
			description: "Whole milk",
			dueDate: "2026-10-01",
		});

		const updated = await update(session, {
			id: task.id,
			title: "Buy oat milk",
		});

		expect(updated?.title).toBe("Buy oat milk");
		expect(updated?.description).toBe("Whole milk");
		expect(updated?.dueDate).toBe("2026-10-01");
	});

	it("can clear nullable fields by setting them to null", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const task = await create(session, { title: "Task" });
		await update(session, {
			id: task.id,
			assignedTo: user.id,
			dueDate: "2026-10-01",
		});

		const updated = await update(session, {
			id: task.id,
			assignedTo: null,
			dueDate: null,
		});

		expect(updated?.assignedTo).toBeNull();
		expect(updated?.dueDate).toBeNull();
	});

	it("cannot update a task from another household", async () => {
		const userA = await createUser({ email: "a@test.local" });
		const userB = await createUser({ email: "b@test.local" });
		const householdA = await createHousehold("A");
		const householdB = await createHousehold("B");
		const sessionA = await createMember(userA.id, householdA.id);
		const sessionB = await createMember(userB.id, householdB.id);

		const task = await create(sessionA, { title: "Household A task" });
		const result = await update(sessionB, {
			id: task.id,
			title: "Hijacked",
		});

		expect(result).toBeNull();
		const tasks = await getAll(sessionA);
		expect(tasks.tasks[0].title).toBe("Household A task");
	});

	it("returns null when no fields are provided", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const task = await create(session, { title: "Unchanged" });
		const result = await update(session, { id: task.id });

		expect(result).toBeNull();
	});

	it("returns null when task is soft-deleted", async () => {
		const user = await createUser();
		const household = await createHousehold();
		const session = await createMember(user.id, household.id);

		const task = await create(session, { title: "Deleted task" });
		await softDelete(session, { id: task.id });

		const result = await update(session, {
			id: task.id,
			title: "New title",
		});
		expect(result).toBeNull();
	});
});
