/**
 * storage.ts — Abstracción de almacenamiento compatible con Vercel.
 *
 * Vercel ejecuta funciones serverless con filesystem de solo lectura,
 * EXCEPTO /tmp/ (que es ephemeral pero escribible).
 *
 * En desarrollo local, podemos usar /public/ para que los archivos
 * sean servidos automáticamente. En producción (Vercel), usamos /tmp/
 * y los servimos a través de /api/files.
 *
 * Para producción real (no demo) se recomienda Vercel Blob o S3.
 */
import path from "path";
import fs from "fs/promises";

// En Vercel: /tmp/ es la única ruta escribible. En local: usamos /tmp también
// para mantener consistencia entre dev y prod.
const STORAGE_ROOT = process.env.STORAGE_ROOT || "/tmp/album-photo-pro";

export type StorageScope = "uploads" | "enhanced" | "albums" | "data";

export async function ensureStorageDir(scope: StorageScope) {
  const dir = path.join(STORAGE_ROOT, scope);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function storagePath(scope: StorageScope, filename: string) {
  return path.join(STORAGE_ROOT, scope, filename);
}

/**
 * URL pública para acceder a un archivo. Va a través de /api/files,
 * que streamea desde /tmp/.
 */
export function publicFileUrl(scope: StorageScope, filename: string) {
  return `/api/files?scope=${scope}&name=${encodeURIComponent(filename)}`;
}
