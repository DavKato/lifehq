import type { Session } from "@lifehq/shared";
import { tasks } from "@lifehq/shared/db/schema";
import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";

export const updateTaskSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1).max(255).optional(),
	description: z.string().nullable().optional(),
	assignedTo: z.string().uuid().nullable().optional(),
	dueDate: z.string().nullable().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const deleteTaskSchema = z.object({
	id: z.string().uuid(),
});

export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;

export const toggleTaskSchema = z.object({
	id: z.string().uuid(),
});

export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>;

export const createTaskSchema = z.object({
	title: z.string().min(1).max(255),
});

export const getAllTasksSchema = z.object({
	status: z.enum(["incomplete", "completed"]).nullable().optional(),
	assigneeId: z
		.union([z.string().uuid(), z.literal("unassigned")])
		.nullable()
		.optional(),
	page: z.number().int().positive().optional(),
	limit: z.number().int().positive().max(100).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type GetAllTasksInput = z.infer<typeof getAllTasksSchema>;

export async function update(session: Session, input: UpdateTaskInput) {
	const { id, ...fields } = input;

	const setValues: Partial<typeof tasks.$inferInsert> = {};
	if (fields.title !== undefined) setValues.title = fields.title;
	if ("description" in fields)
		setValues.description = fields.description ?? null;
	if ("assignedTo" in fields)
		setValues.assignedTo = fields.assignedTo ?? null;
	if ("dueDate" in fields) setValues.dueDate = fields.dueDate ?? null;

	if (Object.keys(setValues).length === 0) return null;

	const [task] = await db
		.update(tasks)
		.set(setValues)
		.where(
			and(
				eq(tasks.id, id),
				eq(tasks.householdId, session.householdId),
				isNull(tasks.deletedAt),
			),
		)
		.returning();

	return task ?? null;
}

export async function softDelete(session: Session, input: DeleteTaskInput) {
	const [task] = await db
		.update(tasks)
		.set({ deletedAt: new Date() })
		.where(
			and(
				eq(tasks.id, input.id),
				eq(tasks.householdId, session.householdId),
				isNull(tasks.deletedAt),
			),
		)
		.returning();

	return task ?? null;
}

export async function complete(session: Session, input: ToggleTaskInput) {
	const [task] = await db
		.update(tasks)
		.set({ completedAt: new Date() })
		.where(
			and(
				eq(tasks.id, input.id),
				eq(tasks.householdId, session.householdId),
				isNull(tasks.deletedAt),
			),
		)
		.returning();

	return task ?? null;
}

export async function uncomplete(session: Session, input: ToggleTaskInput) {
	const [task] = await db
		.update(tasks)
		.set({ completedAt: null })
		.where(
			and(
				eq(tasks.id, input.id),
				eq(tasks.householdId, session.householdId),
				isNull(tasks.deletedAt),
			),
		)
		.returning();

	return task ?? null;
}

export async function create(session: Session, input: CreateTaskInput) {
	const [task] = await db
		.insert(tasks)
		.values({
			title: input.title,
			householdId: session.householdId,
			createdBy: session.userId,
		})
		.returning();

	return task;
}

export async function getAll(session: Session, input?: GetAllTasksInput) {
	const page = input?.page ?? 1;
	const limit = input?.limit ?? 20;
	const offset = (page - 1) * limit;

	const baseConditions = [
		eq(tasks.householdId, session.householdId),
		isNull(tasks.deletedAt),
	];

	if (input?.status === "incomplete") {
		baseConditions.push(isNull(tasks.completedAt));
	} else if (input?.status === "completed") {
		baseConditions.push(isNotNull(tasks.completedAt));
	}

	if (input?.assigneeId === "unassigned") {
		baseConditions.push(isNull(tasks.assignedTo));
	} else if (input?.assigneeId) {
		baseConditions.push(eq(tasks.assignedTo, input.assigneeId));
	}

	const where = and(...baseConditions);

	const orderBy =
		input?.status === "completed"
			? [desc(tasks.completedAt)]
			: [sql`${tasks.dueDate} asc nulls last`, asc(tasks.createdAt)];

	const [rows, countResult] = await Promise.all([
		db.query.tasks.findMany({
			where,
			with: {
				assignee: {
					columns: { id: true, name: true, image: true },
				},
				creator: {
					columns: { id: true, name: true },
				},
			},
			orderBy,
			limit,
			offset,
		}),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(tasks)
			.where(where),
	]);

	const total = countResult[0]?.count ?? 0;

	return {
		tasks: rows,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit),
	};
}
