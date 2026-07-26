import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subjectsTable = pgTable("subjects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().default(1), // MVP: single user, userId=1
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  difficulty: text("difficulty").notNull().default("medium"), // easy | medium | hard
  teacher: text("teacher"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjectsTable).omit({ id: true, createdAt: true });
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjectsTable.$inferSelect;
