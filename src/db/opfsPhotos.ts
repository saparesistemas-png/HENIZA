/**
 * OPFS (Origin Private File System) para blobs de foto.
 * IndexedDB guarda só metadados; OPFS guarda o arquivo pesado.
 */

const ROOT_DIR = 'heniza-photos';

async function getRoot(): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) return null;
    const root = await navigator.storage.getDirectory();
    return root.getDirectoryHandle(ROOT_DIR, { create: true });
  } catch {
    return null;
  }
}

function pathFor(caseId: string, photoId: string): string {
  return `${caseId}__${photoId}.jpg`;
}

/** dataUrl → ArrayBuffer */
function dataUrlToBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1] || '';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function bufferToDataUrl(buf: ArrayBuffer, mime = 'image/jpeg'): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

export async function opfsSupported(): Promise<boolean> {
  return Boolean(await getRoot());
}

export async function opfsWritePhoto(
  caseId: string,
  photoId: string,
  dataUrl: string
): Promise<{ ok: boolean; path?: string }> {
  const dir = await getRoot();
  if (!dir) return { ok: false };
  try {
    const name = pathFor(caseId, photoId);
    const handle = await dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(dataUrlToBuffer(dataUrl));
    await writable.close();
    return { ok: true, path: name };
  } catch {
    return { ok: false };
  }
}

export async function opfsReadPhoto(
  caseId: string,
  photoId: string
): Promise<string | null> {
  const dir = await getRoot();
  if (!dir) return null;
  try {
    const handle = await dir.getFileHandle(pathFor(caseId, photoId));
    const file = await handle.getFile();
    const buf = await file.arrayBuffer();
    return bufferToDataUrl(buf);
  } catch {
    return null;
  }
}

export async function opfsDeletePhoto(caseId: string, photoId: string): Promise<void> {
  const dir = await getRoot();
  if (!dir) return;
  try {
    await dir.removeEntry(pathFor(caseId, photoId));
  } catch {
    /* */
  }
}
