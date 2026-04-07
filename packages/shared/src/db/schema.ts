import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	decimal,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// ── better-auth managed tables ──────────────────────────────────────────────

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});

// ── app tables ───────────────────────────────────────────────────────────────

export const households = pgTable("households", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const householdMembers = pgTable("household_members", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	householdId: uuid("household_id")
		.notNull()
		.references(() => households.id, { onDelete: "cascade" }),
	role: varchar("role", { length: 20 }).notNull().default("member"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const householdInvites = pgTable("household_invites", {
	id: uuid("id").defaultRandom().primaryKey(),
	householdId: uuid("household_id")
		.notNull()
		.references(() => households.id, { onDelete: "cascade" }),
	token: varchar("token", { length: 255 }).notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
});

export const categories = pgTable("categories", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
});

export const subscriptions = pgTable("subscriptions", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	price: decimal("price", { precision: 10, scale: 2 }).notNull(),
	billingCycle: varchar("billing_cycle", { length: 20 }).notNull(),
	renewalDate: date("renewal_date").notNull(),
	categoryId: uuid("category_id").references(() => categories.id),
	householdId: uuid("household_id")
		.notNull()
		.references(() => households.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at"),
});

export const tasks = pgTable("tasks", {
	id: uuid("id").defaultRandom().primaryKey(),
	title: varchar("title", { length: 255 }).notNull(),
	description: text("description"),
	assignedTo: text("assigned_to").references(() => user.id),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id),
	dueDate: date("due_date"),
	completedAt: timestamp("completed_at"),
	householdId: uuid("household_id")
		.notNull()
		.references(() => households.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at"),
});

export const documents = pgTable("documents", {
	id: uuid("id").defaultRandom().primaryKey(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileSize: integer("file_size").notNull(),
	mimeType: varchar("mime_type", { length: 100 }),
	uploadedBy: text("uploaded_by")
		.notNull()
		.references(() => user.id),
	uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
	s3Key: varchar("s3_key", { length: 500 }).notNull(),
	householdId: uuid("household_id")
		.notNull()
		.references(() => households.id, { onDelete: "cascade" }),
	deletedAt: timestamp("deleted_at"),
});

// ── relations ────────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
	memberships: many(householdMembers),
	assignedTasks: many(tasks, { relationName: "taskAssignee" }),
	createdTasks: many(tasks, { relationName: "taskCreator" }),
	documents: many(documents),
}));

export const householdRelations = relations(households, ({ many }) => ({
	members: many(householdMembers),
	subscriptions: many(subscriptions),
	tasks: many(tasks),
	documents: many(documents),
}));

export const householdMembersRelations = relations(
	householdMembers,
	({ one }) => ({
		user: one(user, {
			fields: [householdMembers.userId],
			references: [user.id],
		}),
		household: one(households, {
			fields: [householdMembers.householdId],
			references: [households.id],
		}),
	}),
);

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
	category: one(categories, {
		fields: [subscriptions.categoryId],
		references: [categories.id],
	}),
	household: one(households, {
		fields: [subscriptions.householdId],
		references: [households.id],
	}),
}));

export const taskRelations = relations(tasks, ({ one }) => ({
	assignee: one(user, {
		fields: [tasks.assignedTo],
		references: [user.id],
		relationName: "taskAssignee",
	}),
	creator: one(user, {
		fields: [tasks.createdBy],
		references: [user.id],
		relationName: "taskCreator",
	}),
	household: one(households, {
		fields: [tasks.householdId],
		references: [households.id],
	}),
}));

// ── types ────────────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Household = typeof households.$inferSelect;
export type NewHousehold = typeof households.$inferInsert;
export type HouseholdMember = typeof householdMembers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type SubscriptionWithCategory = Omit<
	Subscription,
	"createdAt" | "updatedAt" | "deletedAt"
> & {
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	category: Category | null;
};
export type Task = typeof tasks.$inferSelect;
export type Document = typeof documents.$inferSelect;
