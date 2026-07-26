import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, lessonsTable, examsTable, subjectsTable, studySessionsTable } from "@workspace/db";

const router: IRouter = Router();

function computeStreak(sessions: { studiedAt: Date }[]): { current: number; longest: number } {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  const dates = Array.from(
    new Set(sessions.map((s) => s.studiedAt.toISOString().split("T")[0]))
  ).sort().reverse();

  if (dates.length === 0) return { current: 0, longest: 0 };

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let currentStreak = 0;
  if (dates[0] === today || dates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]!);
      const curr = new Date(dates[i]!);
      const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
      if (diff === 1) currentStreak++;
      else break;
    }
  }

  let longestStreak = dates.length > 0 ? 1 : 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]!);
    const curr = new Date(dates[i]!);
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 1;
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

// GET /achievements
router.get("/achievements", async (_req, res): Promise<void> => {
  const [allLessons, allExams, allSubjects, allSessions] = await Promise.all([
    db
      .select({ isCompleted: lessonsTable.isCompleted, isReviewed: lessonsTable.isReviewed })
      .from(lessonsTable)
      .innerJoin(subjectsTable, eq(lessonsTable.subjectId, subjectsTable.id))
      .where(eq(subjectsTable.userId, 1)),
    db.select({ isCompleted: examsTable.isCompleted }).from(examsTable).where(eq(examsTable.userId, 1)),
    db.select().from(subjectsTable).where(eq(subjectsTable.userId, 1)),
    db.select().from(studySessionsTable).where(eq(studySessionsTable.userId, 1)),
  ]);

  const completedLessons = allLessons.filter((l) => l.isCompleted).length;
  const completedExams = allExams.filter((e) => e.isCompleted).length;
  const totalSubjects = allSubjects.length;
  const totalStudyDays = new Set(
    allSessions.map((s) => s.studiedAt.toISOString().split("T")[0])
  ).size;
  const { current: currentStreak, longest: longestStreak } = computeStreak(allSessions);

  const now = new Date().toISOString();

  const badges = [
    {
      id: "first_lesson",
      name: "الدرس الأول",
      description: "أكملت أول درس لك",
      isEarned: completedLessons >= 1,
      earnedAt: completedLessons >= 1 ? now : null,
    },
    {
      id: "ten_lessons",
      name: "عشرة دروس",
      description: "أكملت 10 دروس",
      isEarned: completedLessons >= 10,
      earnedAt: completedLessons >= 10 ? now : null,
    },
    {
      id: "fifty_lessons",
      name: "خمسون درساً",
      description: "أكملت 50 درساً",
      isEarned: completedLessons >= 50,
      earnedAt: completedLessons >= 50 ? now : null,
    },
    {
      id: "first_exam",
      name: "اختبار مُنجز",
      description: "أنهيت أول اختبار",
      isEarned: completedExams >= 1,
      earnedAt: completedExams >= 1 ? now : null,
    },
    {
      id: "streak_3",
      name: "ثلاثة أيام متتالية",
      description: "درست 3 أيام متتالية",
      isEarned: longestStreak >= 3,
      earnedAt: longestStreak >= 3 ? now : null,
    },
    {
      id: "streak_7",
      name: "أسبوع كامل",
      description: "درست 7 أيام متتالية",
      isEarned: longestStreak >= 7,
      earnedAt: longestStreak >= 7 ? now : null,
    },
    {
      id: "streak_30",
      name: "شهر متواصل",
      description: "درست 30 يوماً متتالياً",
      isEarned: longestStreak >= 30,
      earnedAt: longestStreak >= 30 ? now : null,
    },
    {
      id: "five_subjects",
      name: "خمس مواد",
      description: "أضفت 5 مواد دراسية",
      isEarned: totalSubjects >= 5,
      earnedAt: totalSubjects >= 5 ? now : null,
    },
  ];

  res.json({ totalStudyDays, currentStreak, longestStreak, completedLessons, completedExams, totalSubjects, badges });
});

export default router;
