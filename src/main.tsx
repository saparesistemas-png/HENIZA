import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ensureStorage } from './storage';

async function boot() {
  try {
    await ensureStorage();
  } catch (e) {
    console.warn('[HENIZA] storage boot', e);
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
