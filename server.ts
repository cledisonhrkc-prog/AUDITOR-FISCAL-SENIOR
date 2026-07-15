import app from './api/index.ts';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Serve frontend assets
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[ERP Server] Servidor executando!`);
  console.log(`  - Para acessar em seu navegador, use: http://localhost:${PORT}`);
  console.log(`  - Rede (para outros dispositivos):     http://0.0.0.0:${PORT}`);
});
