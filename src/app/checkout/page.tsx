"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function CheckoutInner() {
  const params = useSearchParams();
  const projectId = params.get("projectId");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    region: "Región Metropolitana",
  });

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setErr("No hay proyecto seleccionado.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, customer: form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      window.location.href = data.initPoint;
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="display text-3xl font-bold text-brand-900 mb-6">
        Finalizar compra
      </h1>
      <form onSubmit={pay} className="space-y-4 bg-white border border-brand-200 rounded-xl p-6">
        <Field label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
        <Field label="Dirección" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ciudad" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
          <Field label="Región" value={form.region} onChange={(v) => setForm({ ...form, region: v })} required />
        </div>

        {err && <div className="text-red-600 text-sm">{err}</div>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-3 font-medium disabled:opacity-50"
        >
          {busy ? "Redirigiendo a Mercado Pago…" : "Pagar con Mercado Pago →"}
        </button>
        <p className="text-xs text-brand-500 text-center">
          Serás redirigido a Mercado Pago. Aceptamos tarjetas, transferencia y Webpay.
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-brand-700">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-brand-300 rounded px-3 py-2"
      />
    </label>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={<div className="text-center py-12">Cargando…</div>}>
      <CheckoutInner />
    </Suspense>
  );
}
