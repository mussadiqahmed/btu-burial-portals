import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import tombstonesRoutes from './modules/tombstones/routes';
import { ensureTables } from './database/ensureTables';

const router = Router();
let ready: Promise<void> | null = null;

function init() {
  if (!ready) ready = ensureTables();
  return ready;
}

router.use(async (_req, _res, next) => {
  try {
    await init();
    next();
  } catch (err) {
    next(err);
  }
});

router.get('/health', (_req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).send(JSON.stringify({
    status: 'ok',
    service: 'tombstones',
    timestamp: new Date().toISOString(),
  }));
});

router.use(authRoutes);
router.use(tombstonesRoutes);

export default router;
