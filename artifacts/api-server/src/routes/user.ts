import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { UpsertUserProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /user/profile — always return user id=1 (MVP single user)
router.get("/user/profile", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, 1));
  if (!user) {
    res.status(404).json({ error: "لم يتم إنشاء الملف الشخصي بعد" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    age: user.age,
    educationLevel: user.educationLevel,
    school: user.school,
    major: user.major,
    country: user.country,
    timezone: user.timezone,
    annualGoal: user.annualGoal,
    targetGrade: user.targetGrade,
    dailyStudyHours: user.dailyStudyHours,
    sleepTime: user.sleepTime,
    wakeTime: user.wakeTime,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
});

// POST /user/profile — upsert (create or update) user id=1
router.post("/user/profile", async (req, res): Promise<void> => {
  const parsed = UpsertUserProfileBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid user profile body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, 1));

  let user;
  if (existing) {
    [user] = await db
      .update(usersTable)
      .set({
        name: data.name,
        age: data.age,
        educationLevel: data.educationLevel,
        school: data.school,
        major: data.major ?? null,
        country: data.country,
        timezone: data.timezone,
        annualGoal: data.annualGoal,
        targetGrade: data.targetGrade,
        dailyStudyHours: data.dailyStudyHours,
        sleepTime: data.sleepTime,
        wakeTime: data.wakeTime,
      })
      .where(eq(usersTable.id, 1))
      .returning();
  } else {
    [user] = await db
      .insert(usersTable)
      .values({
        name: data.name,
        age: data.age,
        educationLevel: data.educationLevel,
        school: data.school,
        major: data.major ?? null,
        country: data.country,
        timezone: data.timezone,
        annualGoal: data.annualGoal,
        targetGrade: data.targetGrade,
        dailyStudyHours: data.dailyStudyHours,
        sleepTime: data.sleepTime,
        wakeTime: data.wakeTime,
      })
      .returning();
  }

  res.json({
    id: user.id,
    name: user.name,
    age: user.age,
    educationLevel: user.educationLevel,
    school: user.school,
    major: user.major,
    country: user.country,
    timezone: user.timezone,
    annualGoal: user.annualGoal,
    targetGrade: user.targetGrade,
    dailyStudyHours: user.dailyStudyHours,
    sleepTime: user.sleepTime,
    wakeTime: user.wakeTime,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
});

export default router;
