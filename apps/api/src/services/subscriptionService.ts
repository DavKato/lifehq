import type { Session } from "@lifehq/shared";
import { categories, subscriptions } from "@lifehq/shared/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";

export const createSubscriptionSchema = z.object({
	name: z.string().min(1).max(255),
	price: z.number().positive(),
	billingCycle: z.enum(["monthly", "yearly"]),
	renewalDate: z.string().date(),
	categoryId: z.string().uuid().optional(),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

export async function getAll(session: Session) {
	return db.query.subscriptions.findMany({
		where: and(
			eq(subscriptions.householdId, session.householdId),
			isNull(subscriptions.deletedAt),
		),
		with: {
			category: true,
		},
		orderBy: (subs, { desc }) => [desc(subs.createdAt)],
	});
}

export async function getById(session: Session, id: string) {
	const sub = await db.query.subscriptions.findFirst({
		where: and(
			eq(subscriptions.id, id),
			eq(subscriptions.householdId, session.householdId),
			isNull(subscriptions.deletedAt),
		),
		with: {
			category: true,
		},
	});

	return sub;
}

export async function create(session: Session, input: CreateSubscriptionInput) {
	const [subscription] = await db
		.insert(subscriptions)
		.values({
			name: input.name,
			price: input.price.toString(),
			billingCycle: input.billingCycle,
			renewalDate: input.renewalDate,
			categoryId: input.categoryId,
			householdId: session.householdId,
		})
		.returning();

	return subscription;
}

export async function update(
	session: Session,
	id: string,
	input: UpdateSubscriptionInput,
) {
	const [subscription] = await db
		.update(subscriptions)
		.set({
			...input,
			price: input.price?.toString(),
			renewalDate: input.renewalDate ?? undefined,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(subscriptions.id, id),
				eq(subscriptions.householdId, session.householdId),
				isNull(subscriptions.deletedAt),
			),
		)
		.returning();

	return subscription;
}

export async function remove(session: Session, id: string) {
	await db
		.update(subscriptions)
		.set({ deletedAt: new Date(), updatedAt: new Date() })
		.where(
			and(
				eq(subscriptions.id, id),
				eq(subscriptions.householdId, session.householdId),
				isNull(subscriptions.deletedAt),
			),
		);
}

export async function getAnalytics(session: Session) {
	const subs = await db.query.subscriptions.findMany({
		where: and(
			eq(subscriptions.householdId, session.householdId),
			isNull(subscriptions.deletedAt),
		),
		with: {
			category: true,
		},
	});

	const byCategory = await db
		.select({
			categoryId: subscriptions.categoryId,
			categoryName: categories.name,
			totalMonthly: sql<string>`SUM(CASE WHEN ${subscriptions.billingCycle} = 'monthly' THEN ${subscriptions.price}::numeric ELSE ${subscriptions.price}::numeric / 12 END)`,
		})
		.from(subscriptions)
		.leftJoin(categories, eq(subscriptions.categoryId, categories.id))
		.where(
			and(
				eq(subscriptions.householdId, session.householdId),
				isNull(subscriptions.deletedAt),
			),
		)
		.groupBy(subscriptions.categoryId, categories.name);

	const totalMonthly = subs.reduce((acc, sub) => {
		const price = parseFloat(sub.price);
		return acc + (sub.billingCycle === "monthly" ? price : price / 12);
	}, 0);

	const totalYearly = totalMonthly * 12;

	return {
		totalMonthly,
		totalYearly,
		byCategory,
	};
}

export async function getAllCategories() {
	return db.query.categories.findMany({
		orderBy: (cats, { asc }) => [asc(cats.name)],
	});
}
