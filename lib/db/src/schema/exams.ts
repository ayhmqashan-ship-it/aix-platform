import { pgTable, text, serial, timestamp, integer, real, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subjectsTable } from "./subjects";

export const examsTable = pgTable("exams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().default(1),
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
  examDate: date("exam_date", { mode: "string" }).notNull(),
  examTime: text("exam_time"), // HH:MM or null
  targetGrade: real("target_grade"),
  notes: text("notes"),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExamSchema = createInsertSchema(examsTable).omit({ id: true, createdAt: true });
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof examsTable.$inferSelect;
