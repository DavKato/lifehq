#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { LifehqStack } from "../lib/LifehqStack";

const app = new cdk.App();

new LifehqStack(app, "LifehqStack-dev", {
	stage: "dev",
	env: {
		account: process.env.CDK_DEV_ACCOUNT,
		region: process.env.CDK_REGION ?? "eu-west-1",
	},
});

new LifehqStack(app, "LifehqStack-prod", {
	stage: "prod",
	env: {
		account: process.env.CDK_PROD_ACCOUNT,
		region: process.env.CDK_REGION ?? "eu-west-1",
	},
});
