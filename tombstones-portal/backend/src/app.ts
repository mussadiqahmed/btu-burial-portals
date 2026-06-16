import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import tombstonesRoutes from './modules/tombstones/routes';
import { ensureTables } from './database/ensureTables';

dotenv.config();

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || '*';
const origins = corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim());

app.use(cors({
  origin: origins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role']
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).send(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
});

app.use('/api', authRoutes);
app.use('/api', tombstonesRoutes);

const PORT = process.env.PORT || 8001;

app.listen(PORT, async () => {
  try {
    await ensureTables();
  } catch (err) {
    console.error('Tombstones tables check failed:', err);
  }
});
