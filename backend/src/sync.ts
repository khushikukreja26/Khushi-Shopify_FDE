import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { jsonSafe } from './json';
import { shopifyClient } from './shopify';

export const syncRouter = Router();
const prisma = new PrismaClient();

async function upsertCustomers(tenantId: string, list: any[]) {
  for (const c of list) {
    await prisma.customer.upsert({
      where: { tenantId_shopifyId: { tenantId, shopifyId: BigInt(c.id) } },
      update: {
        email: c.email ?? null,
        firstName: c.first_name ?? null,
        lastName: c.last_name ?? null,
      },
      create: {
        tenantId,
        shopifyId: BigInt(c.id),
        email: c.email ?? null,
        firstName: c.first_name ?? null,
        lastName: c.last_name ?? null,
      },
    });
  }
}

async function upsertProducts(tenantId: string, list: any[]) {
  for (const p of list) {
    const prices = (p.variants ?? [])
      .map((v: any) => parseFloat(v.price))
      .filter((n: number) => !isNaN(n));
    const min = prices.length ? Math.min(...prices) : null;
    const max = prices.length ? Math.max(...prices) : null;

    await prisma.product.upsert({
      where: { tenantId_shopifyId: { tenantId, shopifyId: BigInt(p.id) } },
      update: { title: p.title, priceMin: min ?? undefined, priceMax: max ?? undefined },
      create: {
        tenantId,
        shopifyId: BigInt(p.id),
        title: p.title,
        priceMin: min ?? undefined,
        priceMax: max ?? undefined,
      },
    });
  }
}

async function upsertOrders(tenantId: string, list: any[]) {
  for (const o of list) {
    // try to find the Customer record by Shopify customer id
    let customerId: string | null = null;
    const shopifyCustomerId = o.customer?.id ?? o.customer_id; // Shopify sometimes gives both
    if (shopifyCustomerId) {
      const customer = await prisma.customer.findUnique({
        where: { tenantId_shopifyId: { tenantId, shopifyId: BigInt(shopifyCustomerId) } },
        select: { id: true },
      });
      customerId = customer?.id ?? null;
    }

    await prisma.order.upsert({
      where: { tenantId_shopifyId: { tenantId, shopifyId: BigInt(o.id) } },
      update: {
        totalPrice: parseFloat(o.total_price ?? '0'),
        currency: o.currency ?? null,
        createdAt: new Date(o.created_at),
        processedAt: o.processed_at ? new Date(o.processed_at) : null,
        customerId, // link (may be null)
      },
      create: {
        tenantId,
        shopifyId: BigInt(o.id),
        totalPrice: parseFloat(o.total_price ?? '0'),
        currency: o.currency ?? null,
        createdAt: new Date(o.created_at),
        processedAt: o.processed_at ? new Date(o.processed_at) : null,
        customerId, // link (may be null)
      },
    });
  }
}


// --- SYNC NOW ---
syncRouter.post('/:tenantId/run', async (req, res) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.tenantId } });
  if (!tenant) return res.status(404).send('tenant not found');

  const s = shopifyClient(tenant.shopDomain, tenant.adminAccessToken);

  const [{ data: { products } }, { data: { customers } }, { data: { orders } }] = await Promise.all([
    s.get('/products.json?limit=250'),
    s.get('/customers.json?limit=250'),
    s.get('/orders.json?status=any&limit=250'),
  ]);

  await upsertProducts(tenant.id, products ?? []);
  await upsertCustomers(tenant.id, customers ?? []);
  await upsertOrders(tenant.id, orders ?? []);

  return res.json({ ok: true, counts: { products: products?.length ?? 0, customers: customers?.length ?? 0, orders: orders?.length ?? 0 } });
});

// --- METRICS ---

// Overview
syncRouter.get('/:tenantId/metrics/overview', async (req, res) => {
  const tenantId = req.params.tenantId;

  const [customers, ordersAgg] = await Promise.all([
    prisma.customer.count({ where: { tenantId } }),
    prisma.order.aggregate({ where: { tenantId }, _sum: { totalPrice: true }, _count: { _all: true } }),
  ]);

  // Prisma aggregate returns numbers (not BigInt), but jsonSafe is harmless here
  return res.json(jsonSafe({
    totalCustomers: customers,
    totalOrders: ordersAgg._count._all,
    totalRevenue: ordersAgg._sum.totalPrice ?? 0,
  }));
});

// Orders by date
syncRouter.get('/:tenantId/metrics/orders-by-date', async (req, res) => {
  const tenantId = req.params.tenantId;
  const from = (req.query.from as string) ?? '1970-01-01';
  const to = (req.query.to as string) ?? '2999-12-31';

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT
      to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS d,
      COUNT(*)::bigint AS orders,
      COALESCE(SUM("totalPrice"), 0)::numeric AS revenue
    FROM "Order"
    WHERE "tenantId" = $1
      AND "createdAt" BETWEEN $2::date AND $3::date
    GROUP BY 1
    ORDER BY 1 ASC
    `,
    tenantId, from, to
  );

  // rows includes BigInt (orders) / numeric → make JSON-safe
  return res.json(jsonSafe(rows));
});

// Top customers
syncRouter.get('/:tenantId/metrics/top-customers', async (req, res) => {
  const tenantId = req.params.tenantId;

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT
      COALESCE(c."email", 'Unknown') AS email,
      COUNT(o.*)::bigint           AS orders,
      COALESCE(SUM(o."totalPrice"), 0)::numeric AS spend
    FROM "Order" o
    LEFT JOIN "Customer" c ON c."id" = o."customerId"
    WHERE o."tenantId" = $1
    GROUP BY email
    ORDER BY spend DESC
    LIMIT 5
    `,
    tenantId
  );

  return res.json(jsonSafe(rows));
});
