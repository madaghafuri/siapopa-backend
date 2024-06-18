import { relations } from "drizzle-orm";
import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const userGroup = pgTable("user_group", {
  id: serial("id").primaryKey(),
  group_name: text("group_name"),
});
export type SelectUserGroup = typeof userGroup.$inferSelect;
