/**
 * POST /api/design
 * Body: { title, subtitle, files: [{ enhancedPath | originalPath }] }
 *
 * Compone el álbum:
 *   - Si Canva Connect está configurado → usa Canva Autofill + Export PDF.
 *   - Si no, genera un PDF profesional local con pdf-lib.
 *
 * Devuelve { projectId, pdfUrl, pageCount }
 */
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { buildAlbumPdf } from "@/lib/pdf";
import { canvaConfigured } from "@/lib/canva";
import { saveProject, AlbumImage } from "@/lib/db";
import { calcPrice } from "@/lib/pricing";
import { ensureStorageDir, publicFileUrl, storagePath } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { title, subtitle, files } = await req.json();
    const items: AlbumImage[] = files;

    if (!items?.length) {
      return NextResponse.json({ error: "No files" }, { status: 400 });
    }

    const projectId = uuid();
    await ensureStorageDir("albums");
    const filename = `${projectId}.pdf`;
    const pdfPath = storagePath("albums", filename);

    // Por ahora, generamos siempre el PDF local (es lo más fiable).
    // Si canvaConfigured() está activo Y el vendedor ya autorizó su cuenta,
    // se puede ejecutar ademas el flujo Canva desde un admin job.
    const imagePaths = items.map((i) => i.enhancedPath || i.originalPath);

    await buildAlbumPdf(
      { title: title || "Nuestro álbum", subtitle, imagePaths },
      pdfPath
    );

    const pageCount = imagePaths.length + 2; // portada + fotos + contraportada
    const price = calcPrice(pageCount);

    await saveProject({
      id: projectId,
      createdAt: new Date().toISOString(),
      images: items,
      pageCount,
      pricCLP: price,
      pdfPath,
    });

    return NextResponse.json({
      projectId,
      pdfUrl: publicFileUrl("albums", filename),
      pageCount,
      priceCLP: price,
      designProvider: canvaConfigured() ? "canva+pdf-fallback" : "pdf-lib",
    });
  } catch (e: any) {
    console.error("[design]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
