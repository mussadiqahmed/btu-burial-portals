import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './modules/auth/auth.routes';
import orderRoutes from './modules/orders/order.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import productionRoutes from './modules/production/production.routes';
import extrasRoutes from './modules/extras/extras.routes';
import followupRoutes from './modules/followup/followup.routes';
import reportsRoutes from './modules/reports/reports.routes';
import designTypesRoutes from './modules/design_types/design_types.routes';
import marketingRoutes from './modules/marketing/marketing.routes';
import materialFamiliesRoutes from './modules/material_families/material_families.routes';
import { ensureMarketingTables } from './database/ensureMarketingTables';
import { ensureEnhancements } from './database/ensureEnhancements';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

const corsOrigins = [
  'https://eem.co.bw',
  'https://www.eem.co.bw',
  'https://api.eem.co.bw',
];
if (process.env.NODE_ENV !== 'production') {
  corsOrigins.push(
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3003',
  );
}

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/', authRoutes);
app.use('/orders', orderRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/production', productionRoutes);
app.use('/extras', extrasRoutes);
app.use('/followup', followupRoutes);
app.use('/reports', reportsRoutes);
app.use('/design-types', designTypesRoutes);
app.use('/marketing', marketingRoutes);
app.use('/material-families', materialFamiliesRoutes);

app.get('/health', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const payload: Record<string, string> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  if (!process.env.DB_USER || !process.env.DB_NAME) {
    payload.db = 'misconfigured';
    payload.db_hint = 'Set DB_USER, DB_PASSWORD, and DB_NAME in endless_api/.env (or cPanel Node.js env vars), then restart.';
    return res.status(200).send(JSON.stringify(payload));
  }

  try {
    const pool = (await import('./database/db')).default;
    await pool.execute('SELECT 1');
    payload.db = 'connected';
  } catch {
    payload.db = 'error';
    payload.db_hint = 'Database credentials in .env are wrong, or the user lacks access to the database.';
  }

  res.status(200).send(JSON.stringify(payload));
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  try {
    await ensureMarketingTables();
    await ensureEnhancements();
    console.log('Database schema verified');
  } catch (err) {
    console.error('Marketing tables check failed:', err);
  }
  console.log(`Server is running on port ${PORT}`);
});
