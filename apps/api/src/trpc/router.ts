import { householdRouter } from "../routers/household";
import { subscriptionRouter } from "../routers/subscription";
import { taskRouter } from "../routers/task";
import { router } from "./index";

export const appRouter = router({
	subscription: subscriptionRouter,
	task: taskRouter,
	household: householdRouter,
});

export type AppRouter = typeof appRouter;
