"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessInner() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const demo = params.get("demo");

  return (
    <div className="max-w-xl mx-auto text-center py-12">
      <div className="text-6xl">🎉</div>
      <h1 className="display text-3xl font-bold text-brand-900 mt-4">
        ¡Gracias por tu compra!
      </h1>
      <p className="text-brand-700 mt-2">
        {demo
          ? "(Modo demo — no se procesó pago real)"
          : "Recibirás un correo con el detalle y seguimiento de tu despacho."}
      </p>
      {orderId && (
        <div className="mt-4 text-sm text-brand-600">
          N° de orden: <code className="bg-brand-100 px-2 py-1 rounded">{orderId}</code>
        </div>
      )}
      <Link
        href="/"
        className="inline-block mt-8 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

export default function Success() {
  return (
    <Suspense fallback={<div className="text-center py-12">Cargando…</div>}>
      <SuccessInner />
    </Suspense>
  );
}
