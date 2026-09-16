# StoragePort — Dexie e SQLite

## Backends

| `VITE_STORAGE_BACKEND` | Implementação | Persistência |
|------------------------|---------------|--------------|
| `dexie` (default) | IndexedDB via Dexie | IndexedDB |
| `sqlite` | sql.js (SQLite WASM) | OPFS `heniza-sqlite/heniza-local.sqlite` |

## Ativar SQLite

No `.env` / Vercel (build do frontend):

```env
VITE_STORAGE_BACKEND=sqlite
```

No boot do app (ex.: `main.tsx` ou `App.tsx`):

```ts
import { ensureStorage } from './storage';

await ensureStorage();
```

Sem `ensureStorage()`, o primeiro `getStorage()` usa Dexie e troca para SQLite em background quando possível.

## Dependência

```bash
npm install sql.js
```

Wasm carregado de CDN jsDelivr (`sql-wasm.wasm`). Offline total do motor SQLite exige empacotar o `.wasm` no `public/`.

## Capacitor (futuro)

No APK, preferir `@capacitor-community/sqlite` implementando o mesmo `StoragePort` — o schema em `sqliteSchema.ts` já é SQL padrão.
