import * as path from "node:path";
import { CfnOutput, Duration, Stack, type StackProps } from "aws-cdk-lib";
import { HttpApi, HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
	Architecture,
	ParamsAndSecretsLayerVersion,
	ParamsAndSecretsVersions,
	Runtime,
} from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import { SSM_SECRET_KEYS } from "../../apps/api/src/config/ssm";

import type { Stage } from "./types";

interface LifehqStackProps extends StackProps {
	stage: Stage;
}

export class LifehqStack extends Stack {
	constructor(scope: Construct, id: string, props: LifehqStackProps) {
		super(scope, id, props);

		const { stage } = props;

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
		const paramsAndSecrets = ParamsAndSecretsLayerVersion.fromVersion(
			ParamsAndSecretsVersions.V1_0_103,
		);

		const lambdaFn = new NodejsFunction(this, "ApiLambda", {
			runtime: Runtime.NODEJS_22_X,
			architecture: Architecture.ARM_64,
			memorySize: 256,
			timeout: Duration.seconds(30),
			entry: path.join(__dirname, "../../apps/api/src/lambda.ts"),
			handler: "handler",
			paramsAndSecrets,
			bundling: {
				format: OutputFormat.ESM,
				target: "node22",
				// Suppress tsx/esbuild warnings about optional native deps
				externalModules: [],
				// Fastify/avvio are CJS-only and use dynamic require() internally.
				// This shim makes require() work inside an ESM bundle.
				banner: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
			},
			environment: {
				STAGE: stageParam,
				BETTER_AUTH_URL: betterAuthUrlParam,
				BETTER_AUTH_TRUSTED_HOSTS: betterAuthTrustedHostsParam,
				// Fastify @fastify/cors reads CORS_ORIGINS; same value as
				// BETTER_AUTH_TRUSTED_HOSTS (the frontend URL).
				CORS_ORIGINS: betterAuthTrustedHostsParam,
				// DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BETTER_AUTH_SECRET
				// are fetched at cold-start via the Parameters & Secrets Lambda Extension
				// (SSM SecureString refs are not supported in Lambda env vars).
			},
		});

		// Grant the Lambda permission to read the 4 SecureString parameters.
		lambdaFn.addToRolePolicy(
			new PolicyStatement({
				actions: ["ssm:GetParameter"],
				resources: SSM_SECRET_KEYS.map(
					(key) =>
						`arn:aws:ssm:${this.region}:${this.account}:parameter/lifehq/${stage}/${key}`,
				),
			}),
		);

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
