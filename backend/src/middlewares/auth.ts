import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

export type AuthedRequest = Request & { user?: { uid: string; tenantId?: string } };

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';

  if (!token) return res.status(401).json({ error: 'missing bearer token' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    // e.g. { uid, tenantId, iat, exp }
    req.user = { uid: String(payload?.uid), tenantId: payload?.tenantId ? String(payload.tenantId) : undefined };
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}
