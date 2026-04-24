/**
 * pricing.ts — cálculo central de precios según cantidad de páginas.
 */
export function calcPrice(pages: number): number {
  const p20 = Number(process.env.ALBUM_PRICE_20_PAGES || 39990);
  const p30 = Number(process.env.ALBUM_PRICE_30_PAGES || 54990);
  const p40 = Number(process.env.ALBUM_PRICE_40_PAGES || 69990);
  if (pages <= 20) return p20;
  if (pages <= 30) return p30;
  if (pages <= 40) return p40;
  // escalar lineal sobre 40 páginas
  return p40 + Math.ceil((pages - 40) / 2) * 2500;
}

export function shippingCost(): number {
  return Number(process.env.SHIPPING_COST || 4990);
}

export function formatCLP(n: number) {
  return "$" + n.toLocaleString("es-CL");
}
