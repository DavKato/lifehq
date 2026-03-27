import type { Category } from "@lifehq/shared/db/schema";

export type SubItem = {
	id: string;
	name: string;
	price: string;
	billingCycle: "monthly" | "yearly";
	renewalDate: string;
	categoryId: string | null;
	category: Category | null;
};
