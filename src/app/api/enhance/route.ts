/**
 * POST /api/enhance
 * Body: { files: [{ id, originalPath, url }] }
 * Llama a Replicate (Real-ESRGAN) para mejorar cada imagen y guarda
 * los resultados en /tmp/album-photo-pro/enhanced/.
 */
import { NextRequest, NextResponse } from "next/server";
import { enhanceImage } from "@/lib/replicate";
import { ensureStorageDir, publicFileUrl, storagePath } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { files } = await req.json();
    if (!Array.isArray(files) || !files.length) {
      return NextResponse.json({ error: "No files" }, { status: 400 });
    }

    await ensureStorageDir("enhanced");

    const results = [];
    for (const f of files) {
      const filename = `${f.id}.jpg`;
      const outFile = storagePath("enhanced", filename);
      const res = await enhanceImage(f.originalPath, outFile);
      results.push({
        ...f,
        enhancedPath: res.outputPath,
        enhancedUrl: publicFileUrl("enhanced", filename),
        provider: res.provider,
        model: res.enhancedWith,
      });
    }

    return NextResponse.json({ files: results });
  } catch (e: any) {
    console.error("[enhance]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
