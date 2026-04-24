/**
 * GET /api/files?scope=uploads|enhanced|albums&name=<filename>
 *
 * Sirve archivos almacenados en /tmp/album-photo-pro/<scope>/<name>.
 * Necesario porque en Vercel /tmp/ no es accesible públicamente,
 * y nuestros uploads/PDFs viven ahí (filesystem read-only para /public).
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { storagePath, StorageScope } from "@/lib/storage";

export const runtime = "nodejs";

const ALLOWED: StorageScope[] = ["uploads", "enhanced", "albums"];

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get("scope") as StorageScope | null;
    const name = req.nextUrl.searchParams.get("name");

    if (!scope || !name) {
      return NextResponse.json({ error: "Missing scope or name" }, { status: 400 });
    }
    if (!ALLOWED.includes(scope)) {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }
    // Sanitizar nombre para evitar path traversal
    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const filePath = storagePath(scope, name);
    const buf = await fs.readFile(filePath);
    const ext = path.extname(name).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e: any) {
    if (e.code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    console.error("[files]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
