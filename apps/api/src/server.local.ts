import { buildApp } from "./app";
import { config } from "./config/env";
import { runMigrations } from "./db/migrate";
import { runSeed } from "./db/seed";

await runMigrations(config.DATABASE_URL);
await runSeed();

const app = await buildApp();

const port = Number(config.PORT ?? 3001);

app.listen({ port, host: "0.0.0.0" }, (err, address) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
	console.log(`Server listening at ${address}`);
});
