import * as schema from "@lifehq/shared/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { dbConfig } from "../config/env";

const connectionString = dbConfig.DATABASE_URL;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
