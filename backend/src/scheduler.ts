import axios from 'axios';
import cron from 'node-cron';

const ids = (process.env.CRON_TENANT_IDS ?? '').split(',').filter(Boolean);
const base = process.env.API_BASE ?? 'http://localhost:5000';

cron.schedule('*/15 * * * *', async () => {
  for (const id of ids) {
    try { await axios.post(`${base}/api/sync/${id}/run`); }
    catch (e: any) { console.error('cron failed', id, e.message); }
  }
});
