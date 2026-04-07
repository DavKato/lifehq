import type { Session } from "@lifehq/shared";
import { tasks } from "@lifehq/shared/db/schema";
import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";

export const deleteTaskSchema = z.object({
	id: z.string().uuid(),
});

export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;

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
