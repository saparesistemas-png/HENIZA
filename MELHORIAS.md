# Melhorias HENIZA / OficIA

## Adicionado

1. API serverless (`api/`) - diagnose, health, budgets, stock, history
2. Auth segura (`src/authService.ts`) - hash SHA-256 + salt
3. Offline (`src/store`, `src/sync`, `src/services`)
4. `vercel.json` para deploy
5. PWA (`public/sw.js`) e Capacitor (`capacitor.config.ts`)

## Deploy Vercel

1. Importar este repositorio
2. Env: `GEMINI_API_KEY`
3. Build: `vite build` | Output: `dist`

## Admin bootstrap

Email: `admin@heniza.local`
Senha: definida via `ensureBootstrapAdmin` no App (trocar apos primeiro login)
