import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subjectsTable } from "./subjects";

// Weekly class schedule entries
export const scheduleEntriesTable = pgTable("schedule_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().default(1),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday ... 6=Saturday
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(), // HH:MM
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
});

export const insertScheduleEntrySchema = createInsertSchema(scheduleEntriesTable).omit({ id: true });
export type InsertScheduleEntry = z.infer<typeof insertScheduleEntrySchema>;
export type ScheduleEntry = typeof scheduleEntriesTable.$inferSelect;
