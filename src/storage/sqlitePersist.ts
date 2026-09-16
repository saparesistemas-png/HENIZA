/**
 * Persistência do arquivo SQLite em OPFS (ou memory-only se OPFS indisponível).
 */

const DIR = 'heniza-sqlite';
const FILE = 'heniza-local.sqlite';

async function getDir(): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) return null;
    const root = await navigator.storage.getDirectory();
    return root.getDirectoryHandle(DIR, { create: true });
  } catch {
    return null;
  }
}

export async function loadSqliteBytes(): Promise<Uint8Array | null> {
  const dir = await getDir();
  if (!dir) return null;
  try {
    const handle = await dir.getFileHandle(FILE);
    const file = await handle.getFile();
    return new Uint8Array(await file.arrayBuffer());
  } catch {
    return null;
  }
}

export async function saveSqliteBytes(data: Uint8Array): Promise<boolean> {
  const dir = await getDir();
  if (!dir) return false;
  try {
    const handle = await dir.getFileHandle(FILE, { create: true });
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}
