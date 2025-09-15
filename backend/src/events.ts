import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';
import { Router } from 'express';
import type { AuthedRequest } from './middlewares/auth';

export const eventsRouter = Router();
const prisma = new PrismaClient();

/**
 * POST /api/events/:tenantId
 * Body: { type: string; metadata?: object; idempotencyKey?: string }
 *
 * Creates a custom event for a tenant.
 * Example types: "checkout_started", "cart_abandoned"
 */
eventsRouter.post('/:tenantId', async (req: AuthedRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { type, metadata, idempotencyKey } = req.body || {};

    // basic input validation
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
    if (typeof type !== 'string' || !type.trim()) return res.status(400).json({ error: 'type required' });
    if (metadata && typeof metadata !== 'object') return res.status(400).json({ error: 'metadata must be an object if provided' });

    // Optional: enforce that path tenant matches JWT tenant (extra isolation)
    if (req.user?.tenantId && req.user.tenantId !== tenantId) {
      return res.status(403).json({ error: 'tenant mismatch' });
    }

    // ensure tenant exists
    const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!t) return res.status(404).json({ error: 'tenant not found' });

    // (optional) simple idempotency: if client sends idempotencyKey, do not duplicate
    if (idempotencyKey && typeof idempotencyKey === 'string') {
      const exists = await prisma.event.findFirst({
        where: { tenantId, type, metadata: { path: ['idempotencyKey'], equals: idempotencyKey } },
        select: { id: true }
      });
      if (exists) return res.status(200).json({ ok: true, id: exists.id, dedup: true });
    }

    const ev = await prisma.event.create({
      data: {
        tenantId,
        type: type.trim(),
        metadata: metadata ? metadata : null
      }
    });

    return res.json({ ok: true, id: ev.id });
  } catch (e: any) {
    console.error('POST /events error', e?.message || e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * GET /api/events/:tenantId/metrics/by-type
 * -> [{ type: 'checkout_started', cnt: 12 }, ...]
 */
eventsRouter.get('/:tenantId/metrics/by-type', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT type, COUNT(*)::int AS cnt
       FROM "Event"
       WHERE "tenantId" = $1
       GROUP BY 1
       ORDER BY cnt DESC`,
      tenantId
    );

    return res.json(rows);
  } catch (e: any) {
    console.error('GET events by-type error', e?.message || e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * GET /api/events/:tenantId/metrics/by-date?from=YYYY-MM-DD&to=YYYY-MM-DD
 * -> [{ d: '2025-09-14', events: 5 }, ...]
 */
eventsRouter.get('/:tenantId/metrics/by-date', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const from = (req.query.from as string) || '1970-01-01';
    const to   = (req.query.to as string)   || '2999-12-31';
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT DATE("createdAt") AS d, COUNT(*)::int AS events
       FROM "Event"
       WHERE "tenantId" = $1 AND "createdAt" BETWEEN $2::date AND $3::date
       GROUP BY 1
       ORDER BY 1 ASC`,
       tenantId, from, to
    );

    // (We don’t return BigInt; COUNT::int ensures plain number)
    return res.json(rows);
  } catch (e: any) {
    console.error('GET events by-date error', e?.message || e);
    return res.status(500).json({ error: 'internal_error' });
  }
});
