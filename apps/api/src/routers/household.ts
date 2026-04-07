import { getMembers } from "../services/householdService";
import { protectedProcedure, router } from "../trpc";

export const householdRouter = router({
	members: protectedProcedure.query(({ ctx }) => getMembers(ctx.session)),
});
