import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './server/routes.js';
import { initDatabase } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  console.log('----------------------------------------------------');
  console.log(' EduManage - Student Management System Server');
  console.log('----------------------------------------------------');

  // Initialize PGlite database with Windows protection
  try {
    await initDatabase();
    console.log('[Database] Ready to accept queries.');
  } catch (dbErr: any) {
    console.error('[Database Fatal Error]', dbErr?.message || dbErr);
  }

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Mount API router
  app.use('/api', apiRouter);

  // In development or when dist doesn't exist, mount Vite dev server as middleware
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Vite] Middleware mounted in development mode.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`[Production] Serving static client build from: ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EduManage] Application is live at: http://localhost:${PORT}`);
    console.log('----------------------------------------------------');
  });
}

startServer().catch((err) => {
  console.error('[Server Fatal] Failed to start server:', err);
  process.exit(1);
});
