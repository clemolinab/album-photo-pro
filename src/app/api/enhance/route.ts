/**
 * POST /api/enhance
 * Body: { files: [{ id, originalPath, url }] }
 * Llama a Replicate (Real-ESRGAN) para mejorar cada imagen y guarda
 * los resultados en /public/enhanced/.
 */
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { enhanceImage } from "@/lib/replicate";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { files } = await req.json();
    if (!Array.isArray(files) || !files.length) {
      return NextResponse.json({ error: "No files" }, { status: 400 });
    }

    const outDir = path.join(process.cwd(), "public", "enhanced");
    await fs.mkdir(outDir, { recursive: true });

    const results = [];
    for (const f of files) {
      const outFile = path.join(outDir, `${f.id}.jpg`);
      const res = await enhanceImage(f.originalPath, outFile);
      results.push({
        ...f,
        enhancedPath: res.outputPath,
        enhancedUrl: `/enhanced/${f.id}.jpg`,
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
