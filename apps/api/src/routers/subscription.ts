import { z } from "zod";
import {
	create,
	createSubscriptionSchema,
	getAll,
	getAllCategories,
	getAnalytics,
	getById,
	remove,
	update,
	updateSubscriptionSchema,
} from "../services/subscriptionService";
import { protectedProcedure, router } from "../trpc";

export const subscriptionRouter = router({
	list: protectedProcedure.query(({ ctx }) => {
		return getAll(ctx.session);
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(({ ctx, input }) => {
			return getById(ctx.session, input.id);
		}),

	create: protectedProcedure
		.input(createSubscriptionSchema)
		.mutation(({ ctx, input }) => {
			return create(ctx.session, input);
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: updateSubscriptionSchema,
			}),
		)
		.mutation(({ ctx, input }) => {
			return update(ctx.session, input.id, input.data);
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(({ ctx, input }) => {
			return remove(ctx.session, input.id);
		}),

	analytics: protectedProcedure.query(({ ctx }) => {
		return getAnalytics(ctx.session);
	}),

	categories: protectedProcedure.query(() => {
		return getAllCategories();
	}),
});
