import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { userGroup } from "./user-group";

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
  })
);
