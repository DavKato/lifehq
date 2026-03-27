import postgres from "postgres";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

export default async function globalTeardown() {
	const sql = postgres(process.env.DATABASE_URL!);

	await sql`DELETE FROM session WHERE id = 'test-session-1'`;
	await sql`DELETE FROM household_members WHERE id = '00000000-0000-0000-0000-000000000002'`;
	await sql`DELETE FROM households WHERE id = '00000000-0000-0000-0000-000000000001'`;
	await sql`DELETE FROM "user" WHERE id = 'test-user-1'`;

	await sql.end();

	rmSync(resolve(import.meta.dirname, ".auth"), {
		recursive: true,
		force: true,
	});
}
