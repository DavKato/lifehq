# LifeHQ Infrastructure

AWS CDK infrastructure for the LifeHQ API. Provisions a Lambda (Fastify via `aws-lambda-fastify`) behind an HTTP API Gateway, with secrets from Secrets Manager and config from SSM Parameter Store.

## Architecture

```
HTTP API Gateway (HttpApi)
  └── ANY /{proxy+} → Lambda (NodejsFunction, Node 22, arm64, 256 MB, 30 s)
                         ├── Secrets Manager: DATABASE_URL, GOOGLE_CLIENT_ID,
                         │                   GOOGLE_CLIENT_SECRET, BETTER_AUTH_SECRET
                         └── SSM: STAGE, BETTER_AUTH_URL, BETTER_AUTH_TRUSTED_HOSTS
```

Two stacks share the same definition, parameterised by `stage`:
- `LifehqStack-dev` — dev AWS account
- `LifehqStack-prod` — prod AWS account

---

## One-time setup per AWS account

These steps must be completed once per account before the first deploy.

### 1. CDK bootstrap

```bash
cdk bootstrap aws://<account-id>/eu-west-1
```

Run this in both the dev and prod accounts. CDK creates an S3 bucket and IAM roles it needs to manage assets.

### 2. Create the OIDC provider and deploy role

The GitHub Actions workflow uses OIDC federation — no long-lived IAM keys are stored anywhere.

In each AWS account, create an IAM OIDC identity provider:

- **Provider URL**: `https://token.actions.githubusercontent.com`
- **Audience**: `sts.amazonaws.com`

Then create an IAM role (`lifehq-deploy-role` or similar) with:

- **Trust policy** — allow GitHub Actions to assume it via OIDC:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<account-id>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<github-org>/<repo-name>:environment:<dev|prod>"
        }
      }
    }
  ]
}
```

- **Permissions policy**: attach `AdministratorAccess` (or a scoped policy covering CDK bootstrap role pass, Lambda, API Gateway, Secrets Manager read, SSM read, CloudFormation, S3, IAM).

Record the role ARN — you'll need it for GitHub Environments.

### 3. Create Secrets Manager secret

In each account, create a secret named `lifehq/<stage>/app` (e.g. `lifehq/dev/app`) as a JSON blob:

```json
{
  "DATABASE_URL": "postgresql://...",
  "GOOGLE_CLIENT_ID": "...",
  "GOOGLE_CLIENT_SECRET": "...",
  "BETTER_AUTH_SECRET": "..."
}
```

Using the AWS CLI:

```bash
aws secretsmanager create-secret \
  --name lifehq/dev/app \
  --secret-string '{
    "DATABASE_URL": "postgresql://...",
    "GOOGLE_CLIENT_ID": "...",
    "GOOGLE_CLIENT_SECRET": "...",
    "BETTER_AUTH_SECRET": "..."
  }'
```

### 4. Create SSM parameters

In each account, create the following SSM parameters (standard tier, free):

```bash
# Stage identifier
aws ssm put-parameter \
  --name /lifehq/dev/STAGE \
  --value dev \
  --type String

# Placeholder for first deploy — update after deploy (see below)
aws ssm put-parameter \
  --name /lifehq/dev/BETTER_AUTH_URL \
  --value https://placeholder.invalid \
  --type String

# Vercel frontend URL (allow CORS and auth trusted hosts)
aws ssm put-parameter \
  --name /lifehq/dev/BETTER_AUTH_TRUSTED_HOSTS \
  --value https://your-app.vercel.app \
  --type String
```

### 5. Configure GitHub Environments

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
  --value https://<api-id>.execute-api.eu-west-1.amazonaws.com \
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
- `CDK_REGION` — AWS region (default: `eu-west-1`)

---

## Teardown

```bash
# Destroy all resources in the stack
pnpm --filter infra cdk destroy LifehqStack-dev
```

CDK retains Secrets Manager secrets by default. After destroying the stack, delete the secret manually:

```bash
aws secretsmanager delete-secret \
  --secret-id lifehq/dev/app \
  --force-delete-without-recovery
```

Also delete the SSM parameters if no longer needed:

```bash
aws ssm delete-parameters \
  --names /lifehq/dev/STAGE /lifehq/dev/BETTER_AUTH_URL /lifehq/dev/BETTER_AUTH_TRUSTED_HOSTS
```
