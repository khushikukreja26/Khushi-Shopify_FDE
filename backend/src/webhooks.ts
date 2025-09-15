import { Router } from 'express';
export const webhooks = Router();
webhooks.post('/shopify', (_req, res) => res.status(200).send('ok'));
