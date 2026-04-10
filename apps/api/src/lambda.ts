import awsLambdaFastify from "aws-lambda-fastify";
import { fetchSsmSecrets } from "./config/ssm";

await fetchSsmSecrets();

// Dynamic import defers env.ts evaluation until process.env is populated above.
const { buildApp } = await import("./app");
const app = await buildApp();

export const handler = awsLambdaFastify(app);
