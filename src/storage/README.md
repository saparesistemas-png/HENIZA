# StoragePort — camada de persistência local

## Objetivo

Isolar IndexedDB/Dexie atrás de uma porta para permitir, sem reescrever a UI:

1. **Dexie** (atual) — PWA / WebView
2. **SQLite WASM + OPFS** (futuro web)
3. **Capacitor SQLite** (futuro APK)

## Uso

```ts
import { getStorage } from '../storage';

const storage = getStorage();
await storage.enqueue({ type: 'CASE_UPSERT', payload: {...}, caseId: 'OS-1' });
const profile = await storage.getVehicleProfile('PLT:ABC1D23');
```

## Backend

| `VITE_STORAGE_BACKEND` | Implementação |
|------------------------|---------------|
| `dexie` (default) | `DexieStorage` |
| `sqlite` | (placeholder → cai no Dexie até existir `SqliteStorage`) |

## O que migrar por último

- `flushOutbox` / circuit breaker podem continuar em `src/db/outbox.ts` e chamar `getStorage()` internamente.
- Fotos: metadados via `StoragePort`; bytes via `opfsPhotos.ts`.
