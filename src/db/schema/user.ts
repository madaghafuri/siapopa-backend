import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { userGroup } from "./user-group.js";
import { relations } from "drizzle-orm";
import { lokasi } from "./lokasi.js";

export const user = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").unique(),
    phone: text("phone"),
    name: varchar("name", { length: 255 }),
    password: varchar("password", { length: 255 }).notNull(),
    photo: varchar("photo", { length: 255 }),
    validasi: boolean("validasi"),
    usergroup_id: integer("usergroup_id").references(() => userGroup.id),
  },
  (table) => ({
    emailIndex: uniqueIndex("emailIndex").on(table.email),
  }),
);

export const usersRelations = relations(user, ({ many, one }) => ({
  lokasis: many(lokasi),
  userGroup: one(userGroup, {
    fields: [user.usergroup_id],
    references: [userGroup.id],
  }),
}));

export type SelectUser = typeof user.$inferSelect;
export type InsertUser = typeof user.$inferInsert;
