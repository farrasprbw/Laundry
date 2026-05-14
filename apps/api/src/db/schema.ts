import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  numeric,
  date,
} from "drizzle-orm/pg-core";

// ============================================================
// Better Auth tables (managed by better-auth, defined here for
// Drizzle schema awareness and relation queries)
// ============================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("worker"), // worker | admin | super_admin
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// Application tables
// ============================================================

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull().default("styler"), // Material Symbol name
  pricePerUnit: integer("price_per_unit").notNull(), // in Rupiah (e.g. 7000 = Rp 7.000)
  unit: text("unit").notNull().default("kg"), // kg | pcs | unit
  estimatedDurationMinutes: integer("estimated_duration_minutes").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(), // #L260510-001
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  totalPrice: integer("total_price").notNull(), // in Rupiah
  status: text("status").notNull().default("PROCESS"), // PROCESS | FINISHED | TAKEN
  paymentMethodId: uuid("payment_method_id")
    .references(() => paymentMethods.id),
  paymentStatus: text("payment_status").notNull().default("UNPAID"), // UNPAID | PAID
  notes: text("notes"),
  finishedAt: timestamp("finished_at"),
  takenAt: timestamp("taken_at"),
  waNotificationSent: boolean("wa_notification_sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(), // deterjen | listrik | air | gaji | transport | sewa | perlengkapan | lainnya
  description: text("description"),
  amount: integer("amount").notNull(), // in Rupiah
  expenseDate: date("expense_date").notNull(),
  recordedById: text("recorded_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// ============================================================
// Type exports for use in services
// ============================================================

export type User = typeof user.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
