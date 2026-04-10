import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { FastifyRequest } from "fastify";
import Fastify from "fastify";
import { auth } from "./auth";
import { config } from "./config/env";
import { getSession } from "./services/authService";
import { createContext } from "./trpc";
import { appRouter } from "./trpc/router";

export async function buildApp() {
	const app = Fastify();

	const allowedOrigins = config.CORS_ORIGINS
		? config.CORS_ORIGINS.split(",").map((o) => o.trim())
		: ["http://localhost:3000"];

	await app.register(cors, {
		origin: allowedOrigins,
		credentials: true,
	});

	app.all("/api/auth/*", async (request, reply) => {
		const url = new URL(request.url, config.BETTER_AUTH_URL);
		const response = await auth.handler(
			new Request(url, {
				method: request.method,
				headers: request.headers as HeadersInit,
				body: ["GET", "HEAD"].includes(request.method)
					? undefined
					: JSON.stringify(request.body),
			}),
		);
		for (const [key, value] of response.headers.entries()) {
			reply.header(key, value);
		}
		const data = await response.text();
		reply.code(response.status).send(data);
	});

	app.register(fastifyTRPCPlugin, {
		prefix: "/trpc",
		trpcOptions: {
			router: appRouter,
			createContext: async ({ req }: { req: FastifyRequest }) => {
				try {
					const authSession = await auth.api.getSession({
						headers: new Headers(
							req.headers as Record<string, string>,
						),
					});
					if (!authSession?.user) {
						return createContext(null);
					}
					const session = await getSession(authSession.user.id);
					return createContext(session);
				} catch {
					return createContext(null);
				}
			},
		},
	});

	app.get("/", async () => {
		return "LifeHQ API";
	});

	return app;
}
