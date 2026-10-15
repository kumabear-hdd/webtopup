import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter, isDigiflazzConfigured, isMidtransConfigured } from './src/server/apiRouter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Security and json parsing for API routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Attach API Router under /api
  app.use('/api', apiRouter);

  // In development, mount Vite dev server middlewares
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static assets from built Vite dist directory
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    // Fallback to index.html for SPA client-side routing
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Express error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[EXPRESS ERROR]', err);
    if (!res.headersSent) {
      if (typeof res.status === 'function') {
        res.status(500);
      } else {
        res.statusCode = 500;
      }
      if (typeof res.json === 'function') {
        res.json({ success: false, error: err?.message || 'Internal Server Error' });
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: err?.message || 'Internal Server Error' }));
      }
    }
  });

  app.listen(Number(PORT), '0.0.0.0', () => {
    const isMockSupplier = !isDigiflazzConfigured() || process.env.SUPPLIER_MODE !== 'digiflazz';
    const isMockPayment = !isMidtransConfigured() || process.env.PAYMENT_GATEWAY_MODE !== 'midtrans';

    console.log(`====================================================`);
    console.log(`Kumagemu TopUp Engine active on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Supplier Mode : ${isMockSupplier ? 'Mock Sandbox (Free, no Digiflazz key needed)' : 'Digiflazz Live/Sandbox'}`);
    console.log(`Payment Mode  : ${isMockPayment ? 'Mock Gateway (Free, no Midtrans key needed)' : 'Midtrans Live'}`);
    if (isMockSupplier && isMockPayment) {
      console.log(`Status        : 100% Free Development Ready (Zero Provider Credentials Required)`);
    }
    console.log(`====================================================`);
  });
}

startServer();

