/**
 * canva.ts — Integración con Canva Connect API.
 *
 * Documentación oficial: https://www.canva.dev/docs/connect/
 *
 * Flujo típico:
 *   1) El usuario/vendedor autoriza tu app (OAuth 2.0).
 *   2) Creas un "brand template" en Canva con placeholders (imagen_1, imagen_2...).
 *   3) Usas la Autofill API para generar un diseño poblando los placeholders.
 *   4) Exportas el diseño como PDF listo para imprenta.
 *
 * IMPORTANTE: Canva Connect requiere:
 *   - App aprobada en Canva Developers Portal
 *   - OAuth 2.0 flow (no basta una API key)
 *   - Scopes: `design:content:read`, `design:content:write`, `asset:write`
 *
 * Si las credenciales Canva no están configuradas, el sistema
 * usa el generador local en `lib/pdf.ts` como alternativa.
 */

const CANVA_BASE = "https://api.canva.com/rest/v1";

export type CanvaTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export function canvaConfigured() {
  return Boolean(
    process.env.CANVA_CLIENT_ID &&
      process.env.CANVA_CLIENT_SECRET &&
      process.env.CANVA_BRAND_TEMPLATE_ID
  );
}

/** Genera la URL para iniciar el flujo OAuth del vendedor. */
export function canvaAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.CANVA_CLIENT_ID || "",
    redirect_uri: process.env.CANVA_REDIRECT_URI || "",
    response_type: "code",
    scope:
      "design:content:read design:content:write asset:read asset:write brandtemplate:content:read brandtemplate:meta:read",
    state,
  });
  return `https://www.canva.com/api/oauth/authorize?${params.toString()}`;
}

/** Intercambia el `code` OAuth por tokens. */
export async function canvaExchangeCode(code: string): Promise<CanvaTokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.CANVA_REDIRECT_URI || "",
  });
  const auth = Buffer.from(
    `${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`Canva oauth error ${res.status}`);
  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/** Sube un asset (imagen mejorada) a Canva. */
export async function canvaUploadAsset(
  accessToken: string,
  imageBuffer: Buffer,
  name: string
): Promise<string> {
  const res = await fetch(`${CANVA_BASE}/asset-uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
      "Asset-Upload-Metadata": JSON.stringify({ name_base64: Buffer.from(name).toString("base64") }),
    },
    body: new Uint8Array(imageBuffer),
  });
  if (!res.ok) throw new Error(`Canva upload error ${res.status}`);
  const data = await res.json();
  return data.job.id;
}

/**
 * Crea un diseño a partir de un brand template, rellenando los campos con las imágenes.
 * `fields` debe coincidir con los nombres de placeholders definidos en el template Canva.
 */
export async function canvaAutofill(
  accessToken: string,
  brandTemplateId: string,
  assetFields: Record<string, string>
): Promise<{ designId: string }> {
  const data: Record<string, any> = {};
  for (const [key, assetId] of Object.entries(assetFields)) {
    data[key] = { type: "image", asset_id: assetId };
  }

  const res = await fetch(`${CANVA_BASE}/autofills`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ brand_template_id: brandTemplateId, data }),
  });
  if (!res.ok) throw new Error(`Canva autofill error ${res.status}`);
  const json = await res.json();
  return { designId: json.job.result.design.id };
}

/** Exporta un diseño Canva a PDF imprenta (print-ready). */
export async function canvaExportPdf(
  accessToken: string,
  designId: string
): Promise<{ url: string }> {
  const createRes = await fetch(`${CANVA_BASE}/exports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      design_id: designId,
      format: { type: "pdf", export_quality: "pro" },
    }),
  });
  if (!createRes.ok) throw new Error(`Canva export error ${createRes.status}`);
  const createJson = await createRes.json();
  const jobId = createJson.job.id;

  // Poll hasta que esté listo
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(`${CANVA_BASE}/exports/${jobId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await poll.json();
    if (data.job.status === "success") {
      return { url: data.job.urls[0] };
    }
    if (data.job.status === "failed") {
      throw new Error(`Canva export failed: ${data.job.error?.message}`);
    }
  }
  throw new Error("Canva export timeout");
}
