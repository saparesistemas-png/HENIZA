import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { asExpress } from './api/_lib/nodeHandler';
import diagnose from './api/diagnose';
import chat from './api/chat';
import health from './api/health';
import budgets from './api/budgets';
import stock from './api/stock';
import history from './api/history';
import knowledge from './api/knowledge';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

async function start() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', asExpress(health));
  app.post('/api/diagnose', asExpress(diagnose));
  app.post('/api/gemini/diagnosis', asExpress(diagnose));
  app.post('/api/chat', asExpress(chat));
  app.post('/api/budgets', asExpress(budgets));
  app.post('/api/stock', asExpress(stock));
  app.post('/api/history', asExpress(history));
  app.get('/api/knowledge', asExpress(knowledge));
  app.post('/api/knowledge', asExpress(knowledge));
  app.patch('/api/knowledge', asExpress(knowledge));
  app.put('/api/knowledge', asExpress(knowledge));

  if (process.env.NODE_ENV === 'production') {
    const dist = path.join(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HENIZA] http://localhost:${PORT}`);
    console.log(`[HENIZA] Gemini: ${process.env.GEMINI_API_KEY ? 'on' : 'fallback'}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
