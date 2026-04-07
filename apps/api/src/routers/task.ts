import {
	create,
	createTaskSchema,
	deleteTaskSchema,
	getAll,
	getAllTasksSchema,
	softDelete,
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
});
