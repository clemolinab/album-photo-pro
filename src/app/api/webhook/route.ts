/**
 * POST /api/webhook — Recibe notificaciones de Mercado Pago.
 * Cuando un pago se aprueba, actualiza la orden a "paid" (o "in_production").
 *
 * Mercado Pago envía: { type: "payment", data: { id: "..." } }
 */
import { NextRequest, NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago";
import { getOrder, saveOrder } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.type !== "payment" || !body?.data?.id) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const payment = await getPayment(String(body.data.id));
    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ ok: true });

    const order = await getOrder(orderId);
    if (!order) return NextResponse.json({ ok: true });

    order.mpPaymentId = String(payment.id);
    if (payment.status === "approved") {
      order.status = "paid";
    } else if (payment.status === "cancelled" || payment.status === "rejected") {
      order.status = "cancelled";
    }
    await saveOrder(order);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[webhook]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Mercado Pago a veces usa GET con query params como fallback
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("data.id") || searchParams.get("id");
  if (!id) return NextResponse.json({ ok: true });
  try {
    const payment = await getPayment(id);
    const orderId = payment.external_reference;
    if (orderId) {
      const order = await getOrder(orderId);
      if (order && payment.status === "approved") {
        order.status = "paid";
        order.mpPaymentId = String(payment.id);
        await saveOrder(order);
      }
    }
  } catch (e) {
    console.error("[webhook GET]", e);
  }
  return NextResponse.json({ ok: true });
}
