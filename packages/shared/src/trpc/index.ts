import type { Session } from "@lifehq/shared";
import { initTRPC, TRPCError } from "@trpc/server";

export interface Context {
	session: Session | null;
}

export function createContext(session: Session | null): Context {
	return { session };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const isAuthed = middleware(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	return next({ ctx: { ...ctx, session: ctx.session } });
});

export const protectedProcedure = t.procedure.use(isAuthed);
