import * as schema from "@lifehq/shared/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { config } from "../config/env";

async function runMigrate() {
	const connectionString = config.DATABASE_URL;
	const client = postgres(connectionString, { max: 1 });

	const db = drizzle(client, { schema });

	console.log("Running migrations...");

	await migrate(db, { migrationsFolder: "./drizzle" });

	console.log("Migrations complete!");

	await client.end();
}

runMigrate().catch((err) => {
	console.error(err);
	process.exit(1);
});
