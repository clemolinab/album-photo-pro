/**
 * POST /api/upload
 * Recibe archivos de imagen multipart/form-data y los guarda en /tmp/
 * (única ruta escribible en Vercel serverless). Devuelve la lista con
 * IDs/paths y la URL pública vía /api/files.
 */
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import fs from "fs/promises";
import path from "path";
import { ensureStorageDir, publicFileUrl, storagePath } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];
    if (!files.length) {
      return NextResponse.json({ error: "No files" }, { status: 400 });
    }

    await ensureStorageDir("uploads");

    const saved = [];
    for (const f of files) {
      const id = uuid();
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      const filename = `${id}.${ext}`;
      const fullPath = storagePath("uploads", filename);
      const buf = Buffer.from(await f.arrayBuffer());
      await fs.writeFile(fullPath, buf);
      saved.push({
        id,
        name: f.name,
        size: f.size,
        originalPath: fullPath,
        url: publicFileUrl("uploads", filename),
      });
    }

    return NextResponse.json({ files: saved });
  } catch (e: any) {
    console.error("[upload]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
