import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
export const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
  try {
    const { tenantId, email, password } = req.body || {};
    if (!tenantId || !email || !password) return res.status(400).send('missing fields');

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).send('user exists');

    const hash = await bcrypt.hash(password, 10);
    const u = await prisma.user.create({ data: { tenantId, email, password: hash } });
    return res.json({ id: u.id });
  } catch (e:any) {
    return res.status(400).send(e.message);
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).send('missing fields');

    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) return res.status(401).send('invalid');

    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(401).send('invalid');

    const token = jwt.sign(
      { uid: u.id, tenantId: u.tenantId },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );
    return res.json({ token, tenantId: u.tenantId });
  } catch (e:any) {
    return res.status(400).send(e.message);
  }
});

