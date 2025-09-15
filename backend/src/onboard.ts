import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
const prisma = new PrismaClient();

export const onboardRouter = Router();

onboardRouter.post('/', async (req, res) => {
  try {
    if (req.header('x-admin-key') !== process.env.ADMIN_KEY) {
      return res.status(401).send('unauthorized');
    }
    const { name, shopDomain, adminAccessToken } = req.body || {};
    if (!name || !shopDomain || !adminAccessToken) {
      return res.status(400).send('missing fields');
    }
    const tenant = await prisma.tenant.create({
      data: { name, shopDomain, adminAccessToken }
    });
    return res.json(tenant);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});
