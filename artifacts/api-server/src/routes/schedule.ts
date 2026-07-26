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

async function enrichEntry(entry: typeof scheduleEntriesTable.$inferSelect) {
  const [subject] = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.id, entry.subjectId));
  return {
    id: entry.id,
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    subjectId: entry.subjectId,
    subjectName: subject?.name ?? "غير محدد",
    subjectColor: subject?.color ?? "#6366f1",
  };
}

// GET /schedule
router.get("/schedule", async (req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(scheduleEntriesTable)
    .where(eq(scheduleEntriesTable.userId, 1))
    .orderBy(scheduleEntriesTable.dayOfWeek, scheduleEntriesTable.startTime);

  const enriched = await Promise.all(entries.map(enrichEntry));
  res.json(enriched);
});

// POST /schedule
router.post("/schedule", async (req, res): Promise<void> => {
  const parsed = CreateScheduleEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .insert(scheduleEntriesTable)
    .values({
      userId: 1,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      subjectId: parsed.data.subjectId,
    })
    .returning();

  const enriched = await enrichEntry(entry);
  res.status(201).json(enriched);
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
  if (parsed.data.endTime !== undefined) updateData.endTime = parsed.data.endTime;
  if (parsed.data.subjectId !== undefined) updateData.subjectId = parsed.data.subjectId;

  const [entry] = await db
    .update(scheduleEntriesTable)
    .set(updateData)
    .where(and(eq(scheduleEntriesTable.id, params.data.entryId), eq(scheduleEntriesTable.userId, 1)))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "الحصة غير موجودة" });
    return;
  }

  const enriched = await enrichEntry(entry);
  res.json(enriched);
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
    .where(and(eq(scheduleEntriesTable.id, params.data.entryId), eq(scheduleEntriesTable.userId, 1)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "الحصة غير موجودة" });
    return;
  }

  res.json({ success: true });
});

export default router;
