import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";

// Routers...
import { authRouter } from "./auth";
import { eventsRouter } from "./events";
import { authMiddleware } from "./middlewares/auth";
import { onboardRouter } from "./onboard";
import { syncRouter } from "./sync";
import { tenantRouter } from "./tenant";
import { webhooksRouter } from "./webhooks";

import "./scheduler";

const app = express();

/** ---------------- CORS (FIRST middleware) ---------------- **/
const allowedPreview = /^https:\/\/khushi-shopify-fde-sj8w(?:-[a-z0-9-]+)?\.vercel\.app$/; // previews
const allowedStatic = [
  "https://khushi-shopify-fde-sj8w.vercel.app", // production
  "http://localhost:3000",                       // local dev
];

app.use(
  cors({
    origin(origin, cb) {
      // allow server-to-server (no Origin header)
      if (!origin) return cb(null, true);

      const ok = allowedPreview.test(origin) || allowedStatic.includes(origin);
      return cb(null, ok);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-key", "Authorization"],
    optionsSuccessStatus: 200, // some browsers require 200 for preflight
    credentials: false,        // set true only if you actually use cookies/auth headers cross-site
  })
);

// respond to preflight quickly on all routes
app.options("*", cors());
/** --------------------------------------------------------- **/

app.use(express.json());

// Health
app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

// (Optional) friendly root so base URL doesn’t 404
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "🚀 Shopify FDE API is live",
    health: "/health",
    routes: ["/api/auth", "/api/onboard", "/api/tenants", "/api/sync", "/api/events", "/api/webhooks"],
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/onboard", onboardRouter);
app.use("/api/tenants", tenantRouter);
app.use("/api/sync", syncRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/events", authMiddleware, eventsRouter);

// 404 JSON
app.use((req: Request, res: Response) => res.status(404).json({ error: "Not Found", path: req.path }));

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ API listening on :${port}`));

export default app;

