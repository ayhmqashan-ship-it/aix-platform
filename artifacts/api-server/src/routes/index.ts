import { Router, type IRouter } from "express";
import healthRouter from "./health";
import userRouter from "./user";
import subjectsRouter from "./subjects";
import lessonsRouter from "./lessons";
import scheduleRouter from "./schedule";
import examsRouter from "./exams";
import achievementsRouter from "./achievements";
import decisionRouter from "./decision";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(userRouter);
router.use(subjectsRouter);
router.use(lessonsRouter);
router.use(scheduleRouter);
router.use(examsRouter);
router.use(achievementsRouter);
router.use(decisionRouter);
router.use(dashboardRouter);

export default router;
