/**
 * POST /api/upload
 * Recibe archivos de imagen multipart/form-data y los guarda
 * en /public/uploads/<uuid>.<ext>. Devuelve la lista con IDs/paths.
 */
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];
    if (!files.length) {
      return NextResponse.json({ error: "No files" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const saved = [];
    for (const f of files) {
      const id = uuid();
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      const filename = `${id}.${ext}`;
      const fullPath = path.join(uploadsDir, filename);
      const buf = Buffer.from(await f.arrayBuffer());
      await fs.writeFile(fullPath, buf);
      saved.push({
        id,
        name: f.name,
        size: f.size,
        originalPath: fullPath,
        url: `/uploads/${filename}`,
      });
    }

    return NextResponse.json({ files: saved });
  } catch (e: any) {
    console.error("[upload]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
