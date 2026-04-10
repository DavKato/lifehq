import * as path from "node:path";
import { CfnOutput, Duration, Stack, type StackProps } from "aws-cdk-lib";
import { HttpApi, HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

export type Stage = "dev" | "prod";

interface LifehqStackProps extends StackProps {
	stage: Stage;
}

export class LifehqStack extends Stack {
	constructor(scope: Construct, id: string, props: LifehqStackProps) {
		super(scope, id, props);

		const { stage } = props;

		// SSM Parameter Store — sensitive config (SecureString)
		const databaseUrlParam = StringParameter.valueForSecureStringParameter(
			this,
			`/lifehq/${stage}/DATABASE_URL`,
		);
		const googleClientIdParam =
			StringParameter.valueForSecureStringParameter(
				this,
				`/lifehq/${stage}/GOOGLE_CLIENT_ID`,
			);
		const googleClientSecretParam =
			StringParameter.valueForSecureStringParameter(
				this,
				`/lifehq/${stage}/GOOGLE_CLIENT_SECRET`,
			);
		const betterAuthSecretParam =
			StringParameter.valueForSecureStringParameter(
				this,
				`/lifehq/${stage}/BETTER_AUTH_SECRET`,
			);

		// SSM Parameter Store — non-sensitive config (String)
		const stageParam = StringParameter.valueForStringParameter(
			this,
			`/lifehq/${stage}/STAGE`,
		);
		const betterAuthUrlParam = StringParameter.valueForStringParameter(
			this,
			`/lifehq/${stage}/BETTER_AUTH_URL`,
		);
		const betterAuthTrustedHostsParam =
			StringParameter.valueForStringParameter(
				this,
				`/lifehq/${stage}/BETTER_AUTH_TRUSTED_HOSTS`,
			);

		// Lambda — Fastify app via aws-lambda-fastify adapter
		const lambdaFn = new NodejsFunction(this, "ApiLambda", {
			runtime: Runtime.NODEJS_22_X,
			architecture: Architecture.ARM_64,
			memorySize: 256,
			timeout: Duration.seconds(30),
			entry: path.join(__dirname, "../../apps/api/src/lambda.ts"),
			handler: "handler",
			bundling: {
				format: "esm" as const,
				target: "node22",
				// Suppress tsx/esbuild warnings about optional native deps
				externalModules: [],
			},
			environment: {
				STAGE: stageParam,
				BETTER_AUTH_URL: betterAuthUrlParam,
				BETTER_AUTH_TRUSTED_HOSTS: betterAuthTrustedHostsParam,
				// Fastify @fastify/cors reads CORS_ORIGINS; same value as
				// BETTER_AUTH_TRUSTED_HOSTS (the frontend URL).
				CORS_ORIGINS: betterAuthTrustedHostsParam,
				DATABASE_URL: databaseUrlParam,
				GOOGLE_CLIENT_ID: googleClientIdParam,
				GOOGLE_CLIENT_SECRET: googleClientSecretParam,
				BETTER_AUTH_SECRET: betterAuthSecretParam,
			},
		});

		// HTTP API Gateway — CORS is handled by @fastify/cors in the Lambda,
		// not here, because API Gateway CORS does not resolve SSM dynamic refs.
		const httpApi = new HttpApi(this, "HttpApi", {
			apiName: `lifehq-${stage}`,
		});

		const lambdaIntegration = new HttpLambdaIntegration(
			"LambdaIntegration",
			lambdaFn,
		);

		httpApi.addRoutes({
			path: "/{proxy+}",
			methods: [HttpMethod.ANY],
			integration: lambdaIntegration,
		});

		// Also handle root path
		httpApi.addRoutes({
			path: "/",
			methods: [HttpMethod.ANY],
			integration: lambdaIntegration,
		});

		// Output the API Gateway URL
		new CfnOutput(this, "ApiUrl", {
			value: httpApi.apiEndpoint,
			description: "HTTP API Gateway endpoint URL",
			exportName: `LifehqStack-${stage}-ApiUrl`,
		});
	}
}
