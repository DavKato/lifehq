export const SSM_SECRET_KEYS = [
	"DATABASE_URL",
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"BETTER_AUTH_SECRET",
] as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchParameter(
	url: string,
	token: string,
	key: string,
): Promise<string> {
	// The extension may respond "not ready to serve traffic" briefly after
	// reporting it's listening. Retry with exponential backoff.
	for (let attempt = 0; attempt < 5; attempt++) {
		if (attempt > 0) await sleep(50 * 2 ** attempt); // 100, 200, 400, 800 ms
		const res = await fetch(url, {
			headers: { "X-Aws-Parameters-Secrets-Token": token },
		});
		if (res.status === 400) {
			const body = await res.text();
			if (body.includes("not ready")) continue;
			throw new Error(`SSM fetch failed for ${key}: 400 — ${body}`);
		}
		if (!res.ok) {
			const body = await res.text();
			throw new Error(
				`SSM fetch failed for ${key}: ${res.status} — ${body}`,
			);
		}
		const { Parameter } = (await res.json()) as {
			Parameter: { Value: string };
		};
		return Parameter.Value;
	}
	throw new Error(`SSM extension not ready after retries (key: ${key})`);
}

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
			process.env[key] = await fetchParameter(url, token, key);
		}),
	);
}
