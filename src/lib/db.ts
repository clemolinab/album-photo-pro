/**
 * db.ts — Base de datos simple en JSON (file-based) sobre /tmp/.
 *
 * IMPORTANTE: en Vercel /tmp/ es ephemeral — los datos se borran
 * cuando la función serverless se recicla (~minutos). Está OK para
 * un demo, pero para producción real reemplaza por Postgres,
 * Supabase, o Vercel KV.
 */
import fs from "fs/promises";
import { ensureStorageDir, storagePath } from "./storage";

const ORDERS_FILE = storagePath("data", "orders.json");
const PROJECTS_FILE = storagePath("data", "projects.json");

export type AlbumImage = {
  id: string;
  originalPath: string;
  enhancedPath?: string;
  enhancedUrl?: string;
  width?: number;
  height?: number;
};

export type Project = {
  id: string;
  createdAt: string;
  images: AlbumImage[];
  pageCount: number;
  pricCLP: number;
  pdfPath?: string;
  canvaDesignId?: string;
};

export type Order = {
  id: string;
  createdAt: string;
  projectId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
  };
  status:
    | "pending_payment"
    | "paid"
    | "in_production"
    | "printed"
    | "shipped"
    | "delivered"
    | "cancelled";
  mpPaymentId?: string;
  mpPreferenceId?: string;
  amountCLP: number;
  shippingCLP: number;
  totalCLP: number;
  pdfPath?: string;
  notes?: string;
};

async function ensureFile(file: string, initial: string) {
  await ensureStorageDir("data");
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, initial, "utf-8");
  }
}

async function readJson<T>(file: string, initial: T): Promise<T> {
  await ensureFile(file, JSON.stringify(initial));
  const raw = await fs.readFile(file, "utf-8");
  try {
    return JSON.parse(raw) as T;
  } catch {
    return initial;
  }
}

async function writeJson<T>(file: string, data: T) {
  await ensureStorageDir("data");
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

// --- Projects ---

export async function saveProject(p: Project) {
  const all = await readJson<Project[]>(PROJECTS_FILE, []);
  const idx = all.findIndex((x) => x.id === p.id);
  if (idx >= 0) all[idx] = p;
  else all.push(p);
  await writeJson(PROJECTS_FILE, all);
  return p;
}

export async function getProject(id: string) {
  const all = await readJson<Project[]>(PROJECTS_FILE, []);
  return all.find((p) => p.id === id) || null;
}

export async function listProjects() {
  return readJson<Project[]>(PROJECTS_FILE, []);
}

// --- Orders ---

export async function saveOrder(o: Order) {
  const all = await readJson<Order[]>(ORDERS_FILE, []);
  const idx = all.findIndex((x) => x.id === o.id);
  if (idx >= 0) all[idx] = o;
  else all.push(o);
  await writeJson(ORDERS_FILE, all);
  return o;
}

export async function getOrder(id: string) {
  const all = await readJson<Order[]>(ORDERS_FILE, []);
  return all.find((o) => o.id === id) || null;
}

export async function listOrders() {
  const all = await readJson<Order[]>(ORDERS_FILE, []);
  return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function updateOrderStatus(id: string, status: Order["status"]) {
  const o = await getOrder(id);
  if (!o) return null;
  o.status = status;
  await saveOrder(o);
  return o;
}
