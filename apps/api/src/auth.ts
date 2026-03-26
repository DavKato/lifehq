import * as schema from "@lifehq/shared/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { config } from "./config/env";
import { db } from "./db/client";
import { createHouseholdForUser } from "./services/authService";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	secret: config.BETTER_AUTH_SECRET,
	baseURL: config.BETTER_AUTH_URL,
	trustedOrigins: config.BETTER_AUTH_TRUSTED_HOSTS
		? config.BETTER_AUTH_TRUSTED_HOSTS.split(",")
		: undefined,
	socialProviders: {
		google: {
			clientId: config.GOOGLE_CLIENT_ID,
			clientSecret: config.GOOGLE_CLIENT_SECRET,
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					await createHouseholdForUser(
						user.id,
						`${user.name}'s Household`,
					);
				},
			},
		},
	},
});
