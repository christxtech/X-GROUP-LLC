import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";


export const contacts = pgTable("contacts", {
  id: serial().primaryKey(),
  country: text().notNull(),
  phone: text().notNull(),
  name: text().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial().primaryKey(),
  username: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text().notNull(),
  name: text().notNull(),
  address: text().notNull(),
  canUseVoice: boolean("can_use_voice").default(false),
  canUseImage: boolean("can_use_image").default(false),
  balance: integer().default(0),
  isStopped: boolean("is_stopped").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial().primaryKey(),
  fromUser: text("from_user").notNull(),
  toUser: text("to_user").notNull(),
  message: text().notNull(),
  type: text().default("text"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const spins = pgTable("spins", {
  id: serial().primaryKey(),
  username: text().notNull(),
  resultType: text("result_type").notNull(),
  amount: integer().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const links = pgTable("links", {
  id: serial().primaryKey(),
  platform: text().notNull(),
  url: text().notNull(),
  username: text().default("anonymous"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial().primaryKey(),
  username: text().notNull(),
  imageData: text("image_data").notNull(),
  status: text().default("pending").notNull(),
  approvedAmount: integer("approved_amount"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const withdrawals = pgTable("withdrawals", {
  id: serial().primaryKey(),
  username: text().notNull(),
  amount: integer().notNull(),
  method: text().notNull(),
  contact: text().notNull(),
  status: text().default("pending").notNull(),
  delay: text().default("Instant to 24h"),
  createdAt: timestamp("created_at").defaultNow(),
});
