/**
 * replicate.ts — Mejora de imágenes usando Replicate + Real-ESRGAN.
 *
 * Modelo recomendado para álbumes fotográficos:
 *   nightmareai/real-esrgan  (x4 upscaling con buen detalle facial)
 *
 * Si REPLICATE_API_TOKEN no está configurado, el sistema cae a un
 * procesamiento local con `sharp` (resize + sharpen) como fallback.
 */
import Replicate from "replicate";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const MODEL =
  "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";

export type EnhanceResult = {
  outputPath: string;
  outputUrl?: string;
  provider: "replicate" | "local-fallback";
  enhancedWith: string;
};

export async function enhanceImage(
  inputPath: string,
  outputPath: string
): Promise<EnhanceResult> {
  const token = process.env.REPLICATE_API_TOKEN;

  if (token) {
    try {
      const replicate = new Replicate({ auth: token });
      const buf = await fs.readFile(inputPath);
      const mime = detectMime(inputPath);
      const dataUri = `data:${mime};base64,${buf.toString("base64")}`;

      const output: any = await replicate.run(MODEL, {
        input: { image: dataUri, scale: 4, face_enhance: true },
      });

      const url = Array.isArray(output) ? output[0] : output;
      if (typeof url === "string") {
        const res = await fetch(url);
        const ab = await res.arrayBuffer();
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, Buffer.from(ab));
        return {
          outputPath,
          outputUrl: url,
          provider: "replicate",
          enhancedWith: "real-esrgan-x4",
        };
      }
    } catch (e) {
      console.error("[replicate] falló, usando fallback local:", e);
    }
  }

  // Fallback local con sharp (modesto pero sin costo)
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const meta = await sharp(inputPath).metadata();
  const targetW = Math.min((meta.width || 1024) * 2, 4096);
  await sharp(inputPath)
    .resize(targetW, null, { kernel: "lanczos3", withoutEnlargement: false })
    .sharpen({ sigma: 1.1 })
    .modulate({ saturation: 1.05 })
    .toFile(outputPath);

  return {
    outputPath,
    provider: "local-fallback",
    enhancedWith: "sharp (lanczos3 + sharpen)",
  };
}

function detectMime(p: string) {
  const ext = path.extname(p).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}
