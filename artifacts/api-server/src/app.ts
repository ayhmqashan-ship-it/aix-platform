import express, { type Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { globalErrorHandler, notFoundHandler } from "./middlewares/errorHandler";

const app: Express = express();

// ─── Request Logging ────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ─── CORS ────────────────────────────────────────────────────────────────────
// Allow localhost (dev), *.replit.dev (Replit preview), *.replit.app (deployed)
const allowedOriginPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,
  // Replit previews can use nested subdomains, e.g. <id>.spock.replit.dev.
  /^https:\/\/(?:[a-z0-9-]+\.)+replit\.dev$/,
  /^https:\/\/(?:[a-z0-9-]+\.)+replit\.app$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no Origin header) and same-origin
      if (!origin) return callback(null, true);
      const allowed = allowedOriginPatterns.some((pattern) =>
        pattern.test(origin),
      );
      if (allowed) return callback(null, true);
      logger.warn({ origin }, "CORS: blocked origin");
      return callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }),
);

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
// 120 requests / minute per IP — generous for a single-user MVP, protects
// against runaway clients and basic abuse.
const apiLimiter = rateLimit({
  windowMs: 60 * 1_000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "تجاوزت الحد المسموح به من الطلبات. حاول مرة أخرى بعد دقيقة.",
  },
});

app.use("/api", apiLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── 404 + Global Error Handler (must be last) ───────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
