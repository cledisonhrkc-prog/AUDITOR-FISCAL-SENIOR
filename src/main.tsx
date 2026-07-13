import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clear old caches to solve "não está atualizando" and redirect loops
try {
  if (typeof window !== 'undefined' && 'caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name).catch(() => {});
      }
    }).catch((err) => console.warn('Erro ao limpar cache:', err));
  }
} catch (e) {
  console.warn('Cache API indisponível ou bloqueado no sandbox:', e);
}

// Register service worker for PWA support with instant update activation
try {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registrado:', reg.scope);
          try {
            reg.update();
          } catch (updErr) {
            console.warn('Erro ao atualizar service worker:', updErr);
          }
        })
        .catch((err) => console.error('Erro ao registrar Service Worker:', err));
    });
  }
} catch (e) {
  console.warn('Service Worker indisponível ou bloqueado no sandbox:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

