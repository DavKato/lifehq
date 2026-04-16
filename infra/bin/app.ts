#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { LifehqBootstrapStack } from "../lib/BootstrapStack";
import { LifehqStack } from "../lib/LifehqStack";

const app = new cdk.App();

new LifehqBootstrapStack(app, "LifehqBootstrapStack-dev", {
	stage: "dev",
	env: {
		account: process.env.CDK_DEV_ACCOUNT,
		region: "ap-northeast-1",
	},
});

new LifehqBootstrapStack(app, "LifehqBootstrapStack-prod", {
	stage: "prod",
	env: {
		account: process.env.CDK_PROD_ACCOUNT,
		region: "ap-northeast-1",
	},
});

new LifehqStack(app, "LifehqStack-dev", {
	stage: "dev",
	env: {
		account: process.env.CDK_DEV_ACCOUNT,
		region: "ap-northeast-1",
	},
});

new LifehqStack(app, "LifehqStack-prod", {
	stage: "prod",
	env: {
		account: process.env.CDK_PROD_ACCOUNT,
		region: "ap-northeast-1",
	},
});
