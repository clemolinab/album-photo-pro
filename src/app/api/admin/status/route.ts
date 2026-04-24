/**
 * POST /api/admin/status
 * Body: { orderId, status }
 * Cambia el estado de una orden (paid → in_production → printed → shipped → delivered).
 */
import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const pass = req.headers.get("x-admin-pass");
  if (!pass || pass !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { orderId, status } = await req.json();
  const ok = await updateOrderStatus(orderId, status);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order: ok });
}
