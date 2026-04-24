/**
 * pdf.ts — Generador de PDF imprenta (fallback + preview local).
 *
 * Este módulo arma un álbum A4 apaisado (297x210mm) con portada,
 * páginas dobles y contraportada — listo para imprimirse en cualquier
 * laboratorio fotográfico profesional.
 *
 * Se usa tanto como fallback cuando Canva no está disponible, como
 * para pre-visualización rápida antes del checkout.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const A4_LANDSCAPE = { w: 841.89, h: 595.28 }; // 297 x 210 mm a 72 DPI

export type AlbumInput = {
  title?: string;
  subtitle?: string;
  imagePaths: string[]; // rutas absolutas
};

export async function buildAlbumPdf(
  input: AlbumInput,
  outputPath: string
): Promise<string> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const fontReg = await pdf.embedFont(StandardFonts.TimesRoman);

  // ---------- Portada ----------
  const cover = pdf.addPage([A4_LANDSCAPE.w, A4_LANDSCAPE.h]);
  cover.drawRectangle({
    x: 0, y: 0, width: A4_LANDSCAPE.w, height: A4_LANDSCAPE.h,
    color: rgb(0.1, 0.08, 0.07),
  });

  if (input.imagePaths[0]) {
    const coverImg = await embedImage(pdf, input.imagePaths[0]);
    if (coverImg) {
      const { width, height } = fitInside(
        coverImg.width, coverImg.height,
        A4_LANDSCAPE.w - 100, A4_LANDSCAPE.h - 180
      );
      cover.drawImage(coverImg.img, {
        x: (A4_LANDSCAPE.w - width) / 2,
        y: A4_LANDSCAPE.h - height - 60,
        width, height,
      });
    }
  }

  const title = input.title || "Mi Álbum";
  cover.drawText(title, {
    x: 60, y: 55,
    size: 32, font, color: rgb(0.95, 0.9, 0.82),
  });
  if (input.subtitle) {
    cover.drawText(input.subtitle, {
      x: 60, y: 28,
      size: 12, font: fontReg, color: rgb(0.8, 0.75, 0.7),
    });
  }

  // ---------- Páginas interiores ----------
  // Layouts alternados: 1 foto grande, 2 fotos lado a lado, 3 en mosaico.
  const layouts: ("single" | "duo" | "trio")[] = ["single", "duo", "trio"];
  const imgs = input.imagePaths.slice(1);
  let cursor = 0;
  let layoutIdx = 0;

  while (cursor < imgs.length) {
    const layout = layouts[layoutIdx % layouts.length];
    const page = pdf.addPage([A4_LANDSCAPE.w, A4_LANDSCAPE.h]);
    page.drawRectangle({
      x: 0, y: 0, width: A4_LANDSCAPE.w, height: A4_LANDSCAPE.h,
      color: rgb(0.99, 0.97, 0.93),
    });

    if (layout === "single") {
      const src = imgs[cursor++];
      const emb = await embedImage(pdf, src);
      if (emb) {
        const m = 40;
        const maxW = A4_LANDSCAPE.w - 2 * m;
        const maxH = A4_LANDSCAPE.h - 2 * m;
        const { width, height } = fitInside(emb.width, emb.height, maxW, maxH);
        page.drawImage(emb.img, {
          x: (A4_LANDSCAPE.w - width) / 2,
          y: (A4_LANDSCAPE.h - height) / 2,
          width, height,
        });
      }
    } else if (layout === "duo") {
      const m = 40;
      const gap = 20;
      const colW = (A4_LANDSCAPE.w - 2 * m - gap) / 2;
      const maxH = A4_LANDSCAPE.h - 2 * m;
      for (let i = 0; i < 2 && cursor < imgs.length; i++) {
        const emb = await embedImage(pdf, imgs[cursor++]);
        if (!emb) continue;
        const { width, height } = fitInside(emb.width, emb.height, colW, maxH);
        page.drawImage(emb.img, {
          x: m + i * (colW + gap) + (colW - width) / 2,
          y: (A4_LANDSCAPE.h - height) / 2,
          width, height,
        });
      }
    } else {
      // trio: una foto grande a la izquierda, dos apiladas a la derecha
      const m = 40;
      const gap = 15;
      const bigW = (A4_LANDSCAPE.w - 2 * m - gap) * 0.62;
      const smallW = (A4_LANDSCAPE.w - 2 * m - gap) * 0.38;
      const fullH = A4_LANDSCAPE.h - 2 * m;
      const smallH = (fullH - gap) / 2;

      if (cursor < imgs.length) {
        const big = await embedImage(pdf, imgs[cursor++]);
        if (big) {
          const { width, height } = fitInside(big.width, big.height, bigW, fullH);
          page.drawImage(big.img, {
            x: m + (bigW - width) / 2,
            y: m + (fullH - height) / 2,
            width, height,
          });
        }
      }
      for (let i = 0; i < 2 && cursor < imgs.length; i++) {
        const emb = await embedImage(pdf, imgs[cursor++]);
        if (!emb) continue;
        const { width, height } = fitInside(emb.width, emb.height, smallW, smallH);
        page.drawImage(emb.img, {
          x: m + bigW + gap + (smallW - width) / 2,
          y: m + (1 - i) * (smallH + gap) + (smallH - height) / 2,
          width, height,
        });
      }
    }

    // Número de página sutil
    page.drawText(`— ${pdf.getPageCount() - 1} —`, {
      x: A4_LANDSCAPE.w / 2 - 10,
      y: 15,
      size: 9,
      font: fontReg,
      color: rgb(0.5, 0.4, 0.3),
    });

    layoutIdx++;
  }

  // ---------- Contraportada ----------
  const back = pdf.addPage([A4_LANDSCAPE.w, A4_LANDSCAPE.h]);
  back.drawRectangle({
    x: 0, y: 0, width: A4_LANDSCAPE.w, height: A4_LANDSCAPE.h,
    color: rgb(0.1, 0.08, 0.07),
  });
  back.drawText("Hecho con cariño · Album Photo Pro", {
    x: A4_LANDSCAPE.w / 2 - 150,
    y: A4_LANDSCAPE.h / 2,
    size: 14,
    font: fontReg,
    color: rgb(0.9, 0.85, 0.78),
  });

  const bytes = await pdf.save();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, bytes);
  return outputPath;
}

async function embedImage(pdf: PDFDocument, filePath: string) {
  try {
    // Normalizar a JPG para consistencia e insertar.
    const buf = await fs.readFile(filePath);
    const meta = await sharp(buf).metadata();
    let jpg: Uint8Array = buf;
    if (meta.format !== "jpeg") {
      jpg = await sharp(buf).jpeg({ quality: 92 }).toBuffer();
    }
    const img = await pdf.embedJpg(jpg);
    return { img, width: img.width, height: img.height };
  } catch (e) {
    console.error("[pdf] no pude insertar imagen", filePath, e);
    return null;
  }
}

function fitInside(w: number, h: number, maxW: number, maxH: number) {
  const r = Math.min(maxW / w, maxH / h);
  return { width: w * r, height: h * r };
}
