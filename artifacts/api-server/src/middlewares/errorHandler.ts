/**
 * AIX Global Error Handling Middleware
 *
 * Central error handler for Express — catches all unhandled errors from route
 * handlers (including async rejections that Express 5 auto-propagates) and
 * returns a consistent JSON error shape.
 */
import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { logger } from "../lib/logger";

/** 404 handler — mount AFTER all routes */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "المسار غير موجود" });
}

/** Global error handler — must have 4 params for Express to recognise it */
export const globalErrorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // Resolve HTTP status from various error shapes
  const status =
    typeof (err as { status?: unknown }).status === "number"
      ? (err as { status: number }).status
      : typeof (err as { statusCode?: unknown }).statusCode === "number"
        ? (err as { statusCode: number }).statusCode
        : 500;

  const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";

  logger.error({ err, method: req.method, url: req.url }, "Unhandled error");

  if (res.headersSent) return;

  res.status(status).json({
    // Hide internal details in production
    error:
      status >= 500
        ? "حدث خطأ في الخادم، يرجى المحاولة لاحقاً"
        : message,
  });
};
