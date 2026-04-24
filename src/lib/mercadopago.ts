/**
 * mercadopago.ts — Crea preferencias de pago y verifica webhooks.
 * Docs: https://www.mercadopago.cl/developers/es/docs
 */
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

export function mpClient() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN no configurado");
  return new MercadoPagoConfig({ accessToken: token });
}

export async function createPreference(opts: {
  orderId: string;
  title: string;
  quantity: number;
  unitPriceCLP: number;
  shippingCLP: number;
  payerEmail?: string;
}) {
  const pref = new Preference(mpClient());
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const result = await pref.create({
    body: {
      items: [
        {
          id: opts.orderId,
          title: opts.title,
          quantity: opts.quantity,
          unit_price: opts.unitPriceCLP,
          currency_id: "CLP",
        },
      ],
      shipments: {
        cost: opts.shippingCLP,
        mode: "not_specified",
      },
      payer: opts.payerEmail ? { email: opts.payerEmail } : undefined,
      external_reference: opts.orderId,
      back_urls: {
        success: `${site}/success?orderId=${opts.orderId}`,
        failure: `${site}/checkout?orderId=${opts.orderId}&status=failed`,
        pending: `${site}/success?orderId=${opts.orderId}&status=pending`,
      },
      auto_return: "approved",
      notification_url: `${site}/api/webhook`,
    },
  });

  return {
    preferenceId: result.id!,
    initPoint: result.init_point!,
    sandboxInitPoint: result.sandbox_init_point,
  };
}

export async function getPayment(paymentId: string) {
  const payment = new Payment(mpClient());
  return payment.get({ id: paymentId });
}
