import cors from 'cors';
import 'dotenv/config';
import express from 'express';

// Routers: they must export a Router only, and NOT import from index.ts
import { authRouter } from './auth';
import { onboardRouter } from './onboard';
import { syncRouter } from './sync';
import { webhooks } from './webhooks';

// Initialize the app BEFORE any app.use(...)
const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type','x-admin-key','Authorization']
}));
app.use(express.json());

// Healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/api/tenants', onboardRouter);
app.use('/api/auth', authRouter);
app.use('/api/sync', syncRouter);
app.use('/api/webhooks', webhooks);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ API listening on :${port}`));

// Load scheduler LAST so it doesn't import `app` (it shouldn't import from this file)
import './scheduler';

import { tenantRouter } from './tenant';
app.use('/api/tenants', tenantRouter);

import { eventsRouter } from './events';
app.use('/api/events', eventsRouter);

import { authMiddleware } from './middlewares/auth';

// ... your existing app.use(cors()), app.use(express.json()), etc.

app.use('/api/events', authMiddleware, eventsRouter);
