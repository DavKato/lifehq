import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import {
	ManagedPolicy,
	OpenIdConnectProvider,
	Role,
	WebIdentityPrincipal,
} from "aws-cdk-lib/aws-iam";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import type { Stage } from "./LifehqStack";

interface BootstrapStackProps extends StackProps {
	stage: Stage;
}

export class LifehqBootstrapStack extends Stack {
	constructor(scope: Construct, id: string, props: BootstrapStackProps) {
		super(scope, id, props);

		const { stage } = props;

		const betterAuthUrl = this.node.tryGetContext(
			"betterAuthUrl",
		) as string;
		const betterAuthTrustedHosts = this.node.tryGetContext(
			"betterAuthTrustedHosts",
		) as string;

		// GitHub Actions OIDC identity provider
		const oidcProvider = new OpenIdConnectProvider(
			this,
			"GithubOidcProvider",
			{
				url: "https://token.actions.githubusercontent.com",
				clientIds: ["sts.amazonaws.com"],
			},
		);

		// Deploy role — assumed by GitHub Actions via OIDC
		const deployRole = new Role(this, "DeployRole", {
			roleName: "lifehq-deploy-role",
			assumedBy: new WebIdentityPrincipal(
				oidcProvider.openIdConnectProviderArn,
				{
					StringEquals: {
						"token.actions.githubusercontent.com:aud":
							"sts.amazonaws.com",
					},
					StringLike: {
						"token.actions.githubusercontent.com:sub": `repo:DavKato/lifehq:environment:${stage}`,
					},
				},
			),
		});

		deployRole.addManagedPolicy(
			ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess"),
		);

		new CfnOutput(this, "DeployRoleArn", {
			value: deployRole.roleArn,
			description:
				"IAM role ARN to set as AWS_ROLE_ARN in GitHub Environments",
			exportName: `LifehqBootstrapStack-${stage}-DeployRoleArn`,
		});

		// Non-sensitive SSM parameters (String)
		new StringParameter(this, "StageParam", {
			parameterName: `/lifehq/${stage}/STAGE`,
			stringValue: stage,
			description: `LifeHQ stage identifier (${stage})`,
		});

		new StringParameter(this, "BetterAuthUrlParam", {
			parameterName: `/lifehq/${stage}/BETTER_AUTH_URL`,
			stringValue: betterAuthUrl ?? "https://placeholder.invalid",
			description: "API Gateway base URL for better-auth",
		});

		new StringParameter(this, "BetterAuthTrustedHostsParam", {
			parameterName: `/lifehq/${stage}/BETTER_AUTH_TRUSTED_HOSTS`,
			stringValue:
				betterAuthTrustedHosts ?? "https://placeholder.invalid",
			description: "Vercel frontend URL for CORS and auth trusted hosts",
		});
	}
}
