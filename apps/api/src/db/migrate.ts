import * as schema from "@lifehq/shared/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { config } from "../config/env";

export async function runMigrations() {
	const client = postgres(config.DATABASE_URL, { max: 1 });
	const db = drizzle(client, { schema });

	console.log("Running migrations...");
	await migrate(db, { migrationsFolder: "./drizzle" });
	console.log("Migrations complete!");

	await client.end();
}

// Allow running directly: pnpm --filter api db:migrate
if (process.argv[1]?.endsWith("migrate.ts")) {
	runMigrations().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
