import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  educationLevel: text("education_level").notNull(),
  school: text("school").notNull(),
  major: text("major"),
  country: text("country").notNull(),
  timezone: text("timezone").notNull().default("Asia/Riyadh"),
  annualGoal: text("annual_goal").notNull(),
  targetGrade: real("target_grade").notNull().default(90),
  dailyStudyHours: real("daily_study_hours").notNull().default(4),
  sleepTime: text("sleep_time").notNull().default("23:00"),
  wakeTime: text("wake_time").notNull().default("06:00"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
