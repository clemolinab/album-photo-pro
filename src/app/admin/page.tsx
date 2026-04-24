"use client";
import { useEffect, useState } from "react";

type Order = {
  id: string;
  createdAt: string;
  status: string;
  customer: any;
  amountCLP: number;
  shippingCLP: number;
  totalCLP: number;
  pageCount?: number;
  pdfUrl?: string | null;
};

const STATUSES = [
  "pending_payment",
  "paid",
  "in_production",
  "printed",
  "shipped",
  "delivered",
  "cancelled",
];

export default function Admin() {
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function login() {
    setLoading(true);
    setErr(null);
    const r = await fetch("/api/admin/orders", { headers: { "x-admin-pass": pass } });
    if (r.ok) {
      const d = await r.json();
      setOrders(d.orders);
      setAuthed(true);
    } else {
      setErr("Clave incorrecta.");
    }
    setLoading(false);
  }

  async function changeStatus(orderId: string, status: string) {
    const r = await fetch("/api/admin/status", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-pass": pass },
      body: JSON.stringify({ orderId, status }),
    });
    if (r.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    }
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-12 bg-white border border-brand-200 rounded-xl p-6">
        <h1 className="display text-2xl font-bold text-brand-900">Panel admin</h1>
        <p className="text-sm text-brand-600 mt-1">Ingresa la clave de vendedor.</p>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="mt-4 w-full border border-brand-300 rounded px-3 py-2"
          placeholder="ADMIN_PASSWORD"
        />
        {err && <div className="text-red-600 text-sm mt-2">{err}</div>}
        <button
          onClick={login}
          disabled={loading}
          className="mt-4 w-full bg-brand-600 hover:bg-brand-700 text-white rounded py-2"
        >
          {loading ? "…" : "Entrar"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="display text-3xl font-bold text-brand-900">Órdenes</h1>
      {orders.length === 0 && (
        <div className="bg-white border border-brand-200 rounded-xl p-6 text-brand-600">
          No hay órdenes aún.
        </div>
      )}

      <div className="space-y-3">
        {orders.map((o) => (
          <div
            key={o.id}
            className="bg-white border border-brand-200 rounded-xl p-5 grid md:grid-cols-4 gap-4 items-start"
          >
            <div>
              <div className="text-xs text-brand-500">
                {new Date(o.createdAt).toLocaleString("es-CL")}
              </div>
              <div className="font-mono text-xs text-brand-600">{o.id.slice(0, 8)}…</div>
              <div className="mt-2 text-sm">
                <div><b>{o.customer?.name}</b></div>
                <div>{o.customer?.email}</div>
                <div>{o.customer?.phone}</div>
              </div>
            </div>
            <div className="text-sm">
              <div className="text-brand-500">Despacho a</div>
              <div>{o.customer?.address}</div>
              <div>{o.customer?.city}, {o.customer?.region}</div>
            </div>
            <div>
              <div className="text-sm">
                <span className="text-brand-500">Total:</span>{" "}
                <b>${o.totalCLP.toLocaleString("es-CL")}</b>
              </div>
              <div className="text-sm text-brand-500">
                {o.pageCount} páginas · envío ${o.shippingCLP.toLocaleString("es-CL")}
              </div>
              {o.pdfUrl && (
                <a
                  href={o.pdfUrl}
                  target="_blank"
                  className="inline-block mt-2 text-sm bg-brand-100 hover:bg-brand-200 px-3 py-1 rounded"
                >
                  📄 Descargar PDF imprenta
                </a>
              )}
            </div>
            <div>
              <label className="text-xs text-brand-500">Estado</label>
              <select
                value={o.status}
                onChange={(e) => changeStatus(o.id, e.target.value)}
                className="block w-full mt-1 border border-brand-300 rounded px-2 py-1 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
