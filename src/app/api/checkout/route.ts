/**
 * POST /api/checkout
 * Body: { projectId, customer: {...} }
 * Crea una orden + preferencia de Mercado Pago y devuelve la URL de pago.
 *
 * Si MP no está configurado, devuelve una URL dummy a /success para permitir demo.
 */
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getProject, saveOrder, Order } from "@/lib/db";
import { createPreference } from "@/lib/mercadopago";
import { shippingCost } from "@/lib/pricing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { projectId, customer } = await req.json();
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const orderId = uuid();
    const ship = shippingCost();
    const total = project.pricCLP + ship;

    const order: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      projectId,
      customer,
      status: "pending_payment",
      amountCLP: project.pricCLP,
      shippingCLP: ship,
      totalCLP: total,
      pdfPath: project.pdfPath,
    };

    // Sin MP configurado → devolver URL demo
    if (!process.env.MP_ACCESS_TOKEN) {
      await saveOrder(order);
      return NextResponse.json({
        orderId,
        initPoint: `/success?orderId=${orderId}&demo=1`,
        demo: true,
      });
    }

    const pref = await createPreference({
      orderId,
      title: `Álbum fotográfico (${project.pageCount} páginas)`,
      quantity: 1,
      unitPriceCLP: project.pricCLP,
      shippingCLP: ship,
      payerEmail: customer?.email,
    });

    order.mpPreferenceId = pref.preferenceId;
    await saveOrder(order);

    return NextResponse.json({
      orderId,
      preferenceId: pref.preferenceId,
      initPoint: pref.initPoint,
    });
  } catch (e: any) {
    console.error("[checkout]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
