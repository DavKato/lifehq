import { subscriptionRouter } from "../routers/subscription";
import { router } from "./index";

export const appRouter = router({
	subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
