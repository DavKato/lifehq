import awsLambdaFastify from "aws-lambda-fastify";
import { buildApp } from "./app";

const app = await buildApp();

export const handler = awsLambdaFastify(app);
