import { categories } from "@lifehq/shared/db/schema";
import { db } from "./client";

const defaultCategories = [
	"Streaming",
	"Software",
	"Cloud Storage",
	"Music",
	"Gaming",
	"Fitness",
	"News",
	"Productivity",
	"Utilities",
	"Other",
];

async function seed() {
	console.log("Seeding categories...");

	for (const name of defaultCategories) {
		await db.insert(categories).values({ name }).onConflictDoNothing();
	}

	console.log("Categories seeded!");
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
