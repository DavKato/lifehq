import * as path from "node:path";
import { CfnOutput, Duration, Stack, type StackProps } from "aws-cdk-lib";
import {
	CorsHttpMethod,
	HttpApi,
	HttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
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

		// Secrets Manager — sensitive config (one JSON secret per environment)
		const appSecret = Secret.fromSecretNameV2(
			this,
			"AppSecret",
			`lifehq/${stage}/app`,
		);

		// SSM Parameter Store — non-sensitive config
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
				// Resolved from SSM at synth time
				STAGE: stageParam,
				BETTER_AUTH_URL: betterAuthUrlParam,
				BETTER_AUTH_TRUSTED_HOSTS: betterAuthTrustedHostsParam,
				// Secrets resolved at deploy time via dynamic references
				DATABASE_URL: appSecret
					.secretValueFromJson("DATABASE_URL")
					.unsafeUnwrap(),
				GOOGLE_CLIENT_ID: appSecret
					.secretValueFromJson("GOOGLE_CLIENT_ID")
					.unsafeUnwrap(),
				GOOGLE_CLIENT_SECRET: appSecret
					.secretValueFromJson("GOOGLE_CLIENT_SECRET")
					.unsafeUnwrap(),
				BETTER_AUTH_SECRET: appSecret
					.secretValueFromJson("BETTER_AUTH_SECRET")
					.unsafeUnwrap(),
			},
		});

		// Grant Lambda permission to read the secret
		appSecret.grantRead(lambdaFn);

		// HTTP API Gateway
		const httpApi = new HttpApi(this, "HttpApi", {
			apiName: `lifehq-${stage}`,
			corsPreflight: {
				allowHeaders: ["Content-Type", "Authorization", "Cookie"],
				allowMethods: [CorsHttpMethod.ANY],
				allowOrigins: [betterAuthTrustedHostsParam],
				allowCredentials: true,
			},
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
