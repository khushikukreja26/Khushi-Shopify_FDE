import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";

import { authRouter } from "./auth";
import { eventsRouter } from "./events";
import { authMiddleware } from "./middlewares/auth";
import { onboardRouter } from "./onboard";
import { syncRouter } from "./sync";
import { tenantRouter } from "./tenant";
import { webhooks } from "./webhooks";


import "./scheduler";

const app = express();

/** ---------------- CORS (FIRST middleware) ----------------
 *  Allow: Vercel production, all Vercel preview URLs, local dev.
 *  Also handle OPTIONS preflight with 200 and the proper headers.
 */
const PROD_ORIGIN = "https://khushi-shopify-fde-sj8w.vercel.app";
const PREVIEW_RE = /^https:\/\/khushi-shopify-fde-sj8w-[a-z0-9-]+\.vercel\.app$/;
const LOCAL_ORIGIN = "http://localhost:3000";

// Set headers for allowed origins and short-circuit OPTIONS
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || "";
  const isAllowed =
    origin === PROD_ORIGIN ||
    PREVIEW_RE.test(origin) ||
    origin === LOCAL_ORIGIN;

  // Vary so caches split by Origin
  res.setHeader("Vary", "Origin");

  if (origin && isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, x-admin-key, Authorization"
    );
    // If you ever use cookies across sites, uncomment:
    // res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  if (req.method === "OPTIONS") {
    // Always end preflights quickly
    return res.sendStatus(200);
  }

  return next();
});

// You can still keep cors() for non-browser clients (Postman/cURL)
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // server-to-server or curl
    const ok =
      origin === 'http://localhost:3000' ||
      origin.endsWith('.vercel.app');
    cb(null, ok);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  optionsSuccessStatus: 200,
  credentials: false,
}));

// Preflight handler
app.options('*', cors());

// 🚫 tell browsers/CDNs not to cache API responses
app.use((_, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});
/** --------------------------------------------------------- **/

app.use(express.json());

// Health
app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

// Friendly root
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "🚀 Shopify FDE API is live",
    health: "/health",
    routes: [
      "/api/auth",
      "/api/onboard",
      "/api/tenants",
      "/api/sync",
      "/api/events",
      "/api/webhooks",
    ],
  });
});

// Routes
app.use("/api/auth", authRouter);          // => POST /api/auth/login
app.use("/api/onboard", onboardRouter);
app.use("/api/tenants", tenantRouter);
app.use("/api/sync", syncRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/events", authMiddleware, eventsRouter);

// 404 JSON
app.use((req: Request, res: Response) =>
  res.status(404).json({ error: "Not Found", path: req.path })
);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ API listening on :${port}`));

export default app;
