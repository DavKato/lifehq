import awsLambdaFastify from "aws-lambda-fastify";
import type { FastifyInstance } from "fastify";
import { fetchSsmSecrets } from "./config/ssm";

let proxy: ReturnType<typeof awsLambdaFastify> | null = null;

// Lazy init: deferred to first INVOKE so the Parameters & Secrets extension
// is guaranteed ready before fetchSsmSecrets() is called.
async function getProxy() {
	if (!proxy) {
		await fetchSsmSecrets();
		const { buildApp } = await import("./app");
		const app: FastifyInstance = await buildApp();
		proxy = awsLambdaFastify(app);
	}
	return proxy;
}

export const handler = async (
	event: unknown,
	context: unknown,
): Promise<unknown> => {
	return (await getProxy())(event as never, context as never);
};
