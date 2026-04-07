import {
	complete,
	create,
	createTaskSchema,
	deleteTaskSchema,
	getAll,
	getAllTasksSchema,
	softDelete,
	toggleTaskSchema,
	uncomplete,
	update,
	updateTaskSchema,
} from "../services/taskService";
import { protectedProcedure, router } from "../trpc";

export const taskRouter = router({
	list: protectedProcedure
		.input(getAllTasksSchema.optional())
		.query(({ ctx, input }) => getAll(ctx.session, input)),

	create: protectedProcedure
		.input(createTaskSchema)
		.mutation(({ ctx, input }) => create(ctx.session, input)),

	delete: protectedProcedure
		.input(deleteTaskSchema)
		.mutation(({ ctx, input }) => softDelete(ctx.session, input)),

	complete: protectedProcedure
		.input(toggleTaskSchema)
		.mutation(({ ctx, input }) => complete(ctx.session, input)),

	uncomplete: protectedProcedure
		.input(toggleTaskSchema)
		.mutation(({ ctx, input }) => uncomplete(ctx.session, input)),

	update: protectedProcedure
		.input(updateTaskSchema)
		.mutation(({ ctx, input }) => update(ctx.session, input)),
});
