# LifeHQ Infrastructure

AWS CDK infrastructure for the LifeHQ API. Provisions a Lambda (Fastify via `aws-lambda-fastify`) behind an HTTP API Gateway, with all config and secrets stored in SSM Parameter Store.

## Architecture

```
HTTP API Gateway (HttpApi)
  └── ANY /{proxy+} → Lambda (NodejsFunction, Node 22, arm64, 256 MB, 30 s)
                         ├── SSM SecureString: DATABASE_URL, GOOGLE_CLIENT_ID,
                         │                    GOOGLE_CLIENT_SECRET, BETTER_AUTH_SECRET
                         └── SSM String: STAGE, BETTER_AUTH_URL, BETTER_AUTH_TRUSTED_HOSTS
```

Two stacks share the same definition, parameterised by `stage`:
- `LifehqStack-dev` — dev AWS account
- `LifehqStack-prod` — prod AWS account

---

## One-time setup per AWS account

These steps must be completed once per account before the first deploy.

### 1. CDK bootstrap

```bash
cdk bootstrap aws://<account-id>/ap-northeast-1
```

Run this in both the dev and prod accounts. CDK creates an S3 bucket and IAM roles it needs to manage assets.

### 2. Deploy the bootstrap stack

The bootstrap stack provisions the GitHub Actions OIDC identity provider, the deploy IAM role, and the three non-sensitive SSM parameters — all from a single CDK deploy command:

```bash
pnpm --filter infra cdk deploy LifehqBootstrapStack-dev \
  -c betterAuthUrl=https://placeholder.invalid \
  -c betterAuthTrustedHosts=https://your-app.vercel.app
```

After deploy, the stack prints the deploy role ARN as a `CfnOutput`. Copy it — you'll need it for GitHub Environments (`AWS_ROLE_ARN`).

### 3. Create sensitive SSM parameters (manual — only remaining step)

CloudFormation does not support creating `SecureString` parameters natively. Create these four parameters manually in each account:

```bash
aws ssm put-parameter \
  --name /lifehq/dev/DATABASE_URL \
  --value "postgresql://..." \
  --type SecureString

aws ssm put-parameter \
  --name /lifehq/dev/GOOGLE_CLIENT_ID \
  --value "..." \
  --type SecureString

aws ssm put-parameter \
  --name /lifehq/dev/GOOGLE_CLIENT_SECRET \
  --value "..." \
  --type SecureString

aws ssm put-parameter \
  --name /lifehq/dev/BETTER_AUTH_SECRET \
  --value "..." \
  --type SecureString
```

### 4. Configure GitHub Environments

In the GitHub repository, go to **Settings → Environments** and create two environments: `dev` and `prod`.

For each environment, add these **environment secrets**:

| Secret | Value |
|--------|-------|
| `AWS_ACCOUNT_ID` | The AWS account ID for this environment |
| `AWS_ROLE_ARN` | The deploy role ARN created in step 2 |
| `DATABASE_URL` | The Neon connection string (used for DB migrations) |

---

## Deploying

Trigger the workflow manually from **GitHub → Actions → Deploy → Run workflow**, selecting the target environment (`dev` or `prod`).

The workflow:
1. Installs dependencies
2. Authenticates to AWS via OIDC
3. Runs DB migrations (`pnpm --filter api db:migrate`)
4. Deploys the CDK stack (`LifehqStack-<env>`)
5. Prints the API Gateway URL from `CfnOutput`

---

## Two-pass bootstrap for `BETTER_AUTH_URL`

`BETTER_AUTH_URL` (the API's own base URL) is a chicken-and-egg value: it's the API Gateway URL, which doesn't exist until after the first deploy.

**First deploy**: set the SSM parameter to a placeholder (e.g. `https://placeholder.invalid`). The Lambda will start with an incorrect `BETTER_AUTH_URL`, so auth flows won't work yet.

**After first deploy**: copy the API Gateway URL printed in the workflow log, then update the SSM parameter:

```bash
aws ssm put-parameter \
  --name /lifehq/dev/BETTER_AUTH_URL \
  --value https://<api-id>.execute-api.ap-northeast-1.amazonaws.com \
  --overwrite
```

Then re-run the deploy workflow. The Lambda will now have the correct URL and auth flows will work.

---

## Local CDK commands

```bash
# Synthesise CloudFormation templates (no AWS credentials needed)
pnpm --filter infra cdk synth

# Deploy a specific stack
pnpm --filter infra cdk deploy LifehqStack-dev --require-approval never

# Diff a stack against what's deployed
pnpm --filter infra cdk diff LifehqStack-dev
```

Environment variables required for `deploy` and `diff`:
- `CDK_DEV_ACCOUNT` — dev AWS account ID
- `CDK_PROD_ACCOUNT` — prod AWS account ID

---

## Teardown

```bash
# Destroy all resources in the stack
pnpm --filter infra cdk destroy LifehqStack-dev
```

Delete the SSM parameters if no longer needed:

```bash
aws ssm delete-parameters \
  --names \
    /lifehq/dev/DATABASE_URL \
    /lifehq/dev/GOOGLE_CLIENT_ID \
    /lifehq/dev/GOOGLE_CLIENT_SECRET \
    /lifehq/dev/BETTER_AUTH_SECRET \
    /lifehq/dev/STAGE \
    /lifehq/dev/BETTER_AUTH_URL \
    /lifehq/dev/BETTER_AUTH_TRUSTED_HOSTS
```
