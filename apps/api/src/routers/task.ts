import {
	create,
	createTaskSchema,
	getAll,
	getAllTasksSchema,
} from "../services/taskService";
import { protectedProcedure, router } from "../trpc";

export const taskRouter = router({
	list: protectedProcedure
		.input(getAllTasksSchema.optional())
		.query(({ ctx, input }) => getAll(ctx.session, input)),

	create: protectedProcedure
		.input(createTaskSchema)
		.mutation(({ ctx, input }) => create(ctx.session, input)),
});
