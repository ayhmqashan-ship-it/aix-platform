/**
 * AIX Decision Engine — Local Algorithm (MVP)
 *
 * Analyzes subjects, lessons, and exams to recommend the highest-priority
 * lesson to study right now. No external AI models are used.
 *
 * Scoring factors:
 * 1. Days until next exam for the lesson's subject (closer = higher priority)
 * 2. Subject difficulty (hard = higher priority)
 * 3. Lesson mastery level (lower mastery = higher priority)
 * 4. Completion status (incomplete > unreviewed > reviewed)
 * 5. Time since last review (longer ago = higher priority)
 */

export interface LessonCandidate {
  lessonId: number;
  lessonName: string;
  subjectId: number;
  subjectName: string;
  subjectColor: string;
  subjectDifficulty: string;
  masteryLevel: number;
  isCompleted: boolean;
  isReviewed: boolean;
  lastReviewedAt: Date | null;
}

export interface ExamInfo {
  subjectId: number;
  examDate: string; // YYYY-MM-DD
}

export interface SuggestionResult {
  lessonId: number;
  lessonName: string;
  subjectId: number;
  subjectName: string;
  subjectColor: string;
  reason: string;
  priorityLevel: "critical" | "high" | "medium" | "low";
  confidenceScore: number;
}

function difficultyScore(difficulty: string): number {
  switch (difficulty) {
    case "hard": return 3;
    case "medium": return 2;
    case "easy": return 1;
    default: return 2;
  }
}

function daysUntilDate(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function daysSinceDate(date: Date | null): number {
  if (!date) return 30; // treat as "long ago" if never reviewed
  const diff = new Date().getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function computeSuggestion(
  lessons: LessonCandidate[],
  exams: ExamInfo[]
): SuggestionResult | null {
  if (lessons.length === 0) return null;

  // Build a map of subjectId → nearest exam days
  const nearestExamDays = new Map<number, number>();
  for (const exam of exams) {
    const days = daysUntilDate(exam.examDate);
    const current = nearestExamDays.get(exam.subjectId);
    if (current === undefined || days < current) {
      nearestExamDays.set(exam.subjectId, days);
    }
  }

  // Score each lesson
  const scored = lessons.map((lesson) => {
    let score = 0;
    const reasonParts: string[] = [];

    // Factor 1: Exam proximity (0-40 points)
    const daysToExam = nearestExamDays.get(lesson.subjectId);
    if (daysToExam !== undefined) {
      if (daysToExam <= 1) {
        score += 40;
        reasonParts.push("الاختبار غداً أو اليوم!");
      } else if (daysToExam <= 3) {
        score += 35;
        reasonParts.push(`الاختبار بعد ${daysToExam} أيام`);
      } else if (daysToExam <= 7) {
        score += 25;
        reasonParts.push(`الاختبار خلال أسبوع (${daysToExam} أيام)`);
      } else if (daysToExam <= 14) {
        score += 15;
        reasonParts.push(`الاختبار خلال أسبوعين (${daysToExam} أيام)`);
      } else {
        score += 5;
      }
    }

    // Factor 2: Subject difficulty (0-15 points)
    const diffScore = difficultyScore(lesson.subjectDifficulty);
    score += diffScore * 5;
    if (lesson.subjectDifficulty === "hard") {
      reasonParts.push("مادة صعبة تحتاج وقتاً أطول");
    }

    // Factor 3: Mastery level (0-25 points) — lower mastery → higher priority
    const masteryFactor = Math.max(0, (100 - lesson.masteryLevel) / 4);
    score += masteryFactor;
    if (lesson.masteryLevel < 40) {
      reasonParts.push("مستوى الإتقان منخفض");
    }

    // Factor 4: Completion / review status (0-20 points)
    if (!lesson.isCompleted) {
      score += 20;
      reasonParts.push("الدرس لم يُكتمل بعد");
    } else if (!lesson.isReviewed) {
      score += 15;
      reasonParts.push("الدرس يحتاج إلى مراجعة");
    } else {
      // Factor 5: Time since last review (0-10 points)
      const daysSinceReview = daysSinceDate(lesson.lastReviewedAt);
      if (daysSinceReview > 7) {
        score += Math.min(10, daysSinceReview / 2);
        reasonParts.push(`لم تُراجعه منذ ${daysSinceReview} يوماً`);
      }
    }

    return { lesson, score, reasonParts };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) return null;

  // Determine priority level
  let priorityLevel: "critical" | "high" | "medium" | "low";
  if (best.score >= 60) priorityLevel = "critical";
  else if (best.score >= 40) priorityLevel = "high";
  else if (best.score >= 20) priorityLevel = "medium";
  else priorityLevel = "low";

  // Confidence score: normalize top score relative to max possible (100)
  const confidenceScore = Math.min(100, Math.round(best.score));

  // Build reason string
  const reason =
    best.reasonParts.length > 0
      ? best.reasonParts.slice(0, 2).join("، ")
      : "الأولوية بناءً على تحليل شامل لجميع المواد";

  return {
    lessonId: best.lesson.lessonId,
    lessonName: best.lesson.lessonName,
    subjectId: best.lesson.subjectId,
    subjectName: best.lesson.subjectName,
    subjectColor: best.lesson.subjectColor,
    reason,
    priorityLevel,
    confidenceScore,
  };
}
