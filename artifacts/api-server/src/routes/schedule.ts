import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, scheduleEntriesTable, subjectsTable } from "@workspace/db";
import {
  CreateScheduleEntryBody,
  UpdateScheduleEntryBody,
  UpdateScheduleEntryParams,
  DeleteScheduleEntryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

/** Shared select shape — reused across GET list and single-record responses. */
const entryWithSubjectSelect = {
  id:           scheduleEntriesTable.id,
  dayOfWeek:    scheduleEntriesTable.dayOfWeek,
  startTime:    scheduleEntriesTable.startTime,
  endTime:      scheduleEntriesTable.endTime,
  subjectId:    scheduleEntriesTable.subjectId,
  subjectName:  subjectsTable.name,
  subjectColor: subjectsTable.color,
} as const;

function formatEntry(row: {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectId: number;
  subjectName: string | null;
  subjectColor: string | null;
}) {
  return {
    id:           row.id,
    dayOfWeek:    row.dayOfWeek,
    startTime:    row.startTime,
    endTime:      row.endTime,
    subjectId:    row.subjectId,
    subjectName:  row.subjectName  ?? "غير محدد",
    subjectColor: row.subjectColor ?? "#6366f1",
  };
}

// GET /schedule — single JOIN query, no N+1
router.get("/schedule", async (req, res): Promise<void> => {
  const entries = await db
    .select(entryWithSubjectSelect)
    .from(scheduleEntriesTable)
    .leftJoin(subjectsTable, eq(scheduleEntriesTable.subjectId, subjectsTable.id))
    .where(eq(scheduleEntriesTable.userId, 1))
    .orderBy(scheduleEntriesTable.dayOfWeek, scheduleEntriesTable.startTime);

  res.json(entries.map(formatEntry));
});

// POST /schedule
router.post("/schedule", async (req, res): Promise<void> => {
  const parsed = CreateScheduleEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [inserted] = await db
    .insert(scheduleEntriesTable)
    .values({
      userId:    1,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime:   parsed.data.endTime,
      subjectId: parsed.data.subjectId,
    })
    .returning();

  const [row] = await db
    .select(entryWithSubjectSelect)
    .from(scheduleEntriesTable)
    .leftJoin(subjectsTable, eq(scheduleEntriesTable.subjectId, subjectsTable.id))
    .where(eq(scheduleEntriesTable.id, inserted!.id));

  res.status(201).json(formatEntry(row!));
});

// PATCH /schedule/:entryId
router.patch("/schedule/:entryId", async (req, res): Promise<void> => {
  const params = UpdateScheduleEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateScheduleEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.dayOfWeek !== undefined) updateData.dayOfWeek = parsed.data.dayOfWeek;
  if (parsed.data.startTime !== undefined) updateData.startTime = parsed.data.startTime;
  if (parsed.data.endTime   !== undefined) updateData.endTime   = parsed.data.endTime;
  if (parsed.data.subjectId !== undefined) updateData.subjectId = parsed.data.subjectId;

  const [updated] = await db
    .update(scheduleEntriesTable)
    .set(updateData)
    .where(and(
      eq(scheduleEntriesTable.id, params.data.entryId),
      eq(scheduleEntriesTable.userId, 1),
    ))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "الحصة غير موجودة" });
    return;
  }

  const [row] = await db
    .select(entryWithSubjectSelect)
    .from(scheduleEntriesTable)
    .leftJoin(subjectsTable, eq(scheduleEntriesTable.subjectId, subjectsTable.id))
    .where(eq(scheduleEntriesTable.id, updated.id));

  res.json(formatEntry(row!));
});

// DELETE /schedule/:entryId
router.delete("/schedule/:entryId", async (req, res): Promise<void> => {
  const params = DeleteScheduleEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(scheduleEntriesTable)
    .where(and(
      eq(scheduleEntriesTable.id, params.data.entryId),
      eq(scheduleEntriesTable.userId, 1),
    ))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "الحصة غير موجودة" });
    return;
  }

  res.json({ success: true });
});

export default router;
