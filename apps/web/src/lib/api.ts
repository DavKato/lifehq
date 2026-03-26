import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "api/trpc/router";

export const api = createTRPCReact<AppRouter>();
