import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const prisma = new PrismaClient();
export const tenantRouter = Router();

/** Demo endpoint: list tenants (id, name, shopDomain) */
tenantRouter.get('/', async (_req, res) => {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, shopDomain: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(tenants);
});
