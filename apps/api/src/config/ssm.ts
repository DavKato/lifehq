export const SSM_SECRET_KEYS = [
	"DATABASE_URL",
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"BETTER_AUTH_SECRET",
] as const;

export async function fetchSsmSecrets(): Promise<void> {
	// Only runs inside Lambda; local dev relies on process.env / .env directly.
	if (!process.env.AWS_LAMBDA_FUNCTION_NAME) return;

	const stage = process.env.STAGE ?? "dev";
	const port = process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT ?? "2773";
	const token = process.env.AWS_SESSION_TOKEN ?? "";

	await Promise.all(
		SSM_SECRET_KEYS.map(async (key) => {
			const name = encodeURIComponent(`/lifehq/${stage}/${key}`);
			const url = `http://localhost:${port}/systemsmanager/parameters/get?name=${name}&withDecryption=true`;
			const res = await fetch(url, {
				headers: { "X-Aws-Parameters-Secrets-Token": token },
			});
			if (!res.ok) {
				const body = await res.text();
				throw new Error(
					`SSM fetch failed for ${key}: ${res.status} — ${body}`,
				);
			}
			const { Parameter } = (await res.json()) as {
				Parameter: { Value: string };
			};
			process.env[key] = Parameter.Value;
		}),
	);
}
