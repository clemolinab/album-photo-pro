/**
 * GET /api/admin/orders
 * Autenticación simple: header `x-admin-pass` debe coincidir con ADMIN_PASSWORD.
 * Devuelve todas las órdenes con datos para imprimir y despachar.
 */
import { NextRequest, NextResponse } from "next/server";
import { listOrders, listProjects } from "@/lib/db";

export const runtime = "nodejs";

function authorized(req: NextRequest) {
  const pass = req.headers.get("x-admin-pass");
  return pass && pass === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [orders, projects] = await Promise.all([listOrders(), listProjects()]);
  const joined = orders.map((o) => {
    const p = projects.find((pr) => pr.id === o.projectId);
    return {
      ...o,
      pageCount: p?.pageCount,
      pdfUrl: p?.pdfPath ? `/albums/${p.id}.pdf` : null,
    };
  });
  return NextResponse.json({ orders: joined });
}
