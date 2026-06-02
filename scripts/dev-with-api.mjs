import http from 'node:http';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';

const loadEnvFile = (path) => {
  if (!fs.existsSync(path)) return;
  const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*=/.test(line)) return;
    const index = line.indexOf('=');
    const key = line.slice(0, index);
    const value = line.slice(index + 1).replace(/^"|"$/g, '');
    if (!process.env[key] && value) process.env[key] = value;
  });
};

loadEnvFile('.env');
loadEnvFile('.env.local');
loadEnvFile('.vercel/.env.production.local');
loadEnvFile('.vercel/.env.preview.local');

const port = Number(process.env.DEV_PORT || 5173);
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

const sendError = (res, statusCode, message) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: message }));
};

const parseQuery = (url) => Object.fromEntries(new URL(url, `http://localhost:${port}`).searchParams.entries());

const apiRoutes = {
  '/api/admin/diagnose': '../api/admin/diagnose.js',
  '/api/admin/repair-savings-category': '../api/admin/repair-savings-category.js',
  '/api/admin/sync-savings': '../api/admin/sync-savings.js',
  '/api/admin/grant-plus': '../api/admin/grant-plus.js',
  '/api/admin/app-settings': '../api/admin/app-settings.js',
  '/api/fedapay/create-checkout': '../api/fedapay/create-checkout.js',
  '/api/fedapay/webhook': '../api/fedapay/webhook.js',
};

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, `http://localhost:${port}`).pathname;
  const route = apiRoutes[path];

  if (route) {
    try {
      req.query = parseQuery(req.url);
      const mod = await import(`${route}?t=${Date.now()}`);
      await mod.default(req, res);
    } catch (error) {
      sendError(res, 500, error.message || 'Local API error.');
    }
    return;
  }

  vite.middlewares(req, res);
});

server.listen(port, () => {
  console.log(`Dudukan local with API ready at http://localhost:${port}`);
});
