import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center pt-10 pb-6">
        <h1 className="display text-5xl md:text-6xl font-bold text-brand-900 mb-4">
          Tus recuerdos, en un álbum inolvidable.
        </h1>
        <p className="text-lg text-brand-700 max-w-2xl mx-auto">
          Sube tus fotos, nuestra IA mejora la calidad automáticamente y
          diseñamos un álbum profesional que llega a tu casa.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/editor"
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium"
          >
            Crear mi álbum
          </Link>
          <a
            href="#como-funciona"
            className="px-6 py-3 border border-brand-300 hover:bg-brand-100 rounded-lg"
          >
            Cómo funciona
          </a>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="grid md:grid-cols-4 gap-6">
        {[
          {
            step: "1",
            title: "Sube tus fotos",
            desc: "Arrastra y suelta hasta 60 fotos desde tu celular o computador.",
            icon: "⬆️",
          },
          {
            step: "2",
            title: "IA mejora la calidad",
            desc: "Real-ESRGAN aumenta la resolución, elimina ruido y mejora caras.",
            icon: "✨",
          },
          {
            step: "3",
            title: "Diseño automático",
            desc: "Nuestro agente arma un álbum profesional con layouts editoriales.",
            icon: "🎨",
          },
          {
            step: "4",
            title: "Llega a tu casa",
            desc: "Pagas con Mercado Pago y despachamos el álbum impreso a domicilio.",
            icon: "📦",
          },
        ].map((s) => (
          <div
            key={s.step}
            className="bg-white border border-brand-200 rounded-xl p-5 shadow-sm"
          >
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-xs text-brand-500 font-bold">PASO {s.step}</div>
            <div className="font-semibold text-brand-800 mt-1">{s.title}</div>
            <p className="text-sm text-brand-700 mt-1">{s.desc}</p>
          </div>
        ))}
      </section>

      {/* Precios */}
      <section>
        <h2 className="display text-3xl font-bold text-brand-900 mb-6 text-center">
          Precios
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { pages: 20, price: 39990, popular: false },
            { pages: 30, price: 54990, popular: true },
            { pages: 40, price: 69990, popular: false },
          ].map((p) => (
            <div
              key={p.pages}
              className={`rounded-xl p-6 border-2 ${
                p.popular
                  ? "border-brand-500 bg-brand-50"
                  : "border-brand-200 bg-white"
              }`}
            >
              {p.popular && (
                <div className="inline-block bg-brand-600 text-white text-xs px-2 py-1 rounded mb-2">
                  Más elegido
                </div>
              )}
              <div className="display text-2xl font-bold text-brand-900">
                {p.pages} páginas
              </div>
              <div className="text-3xl font-bold text-brand-700 my-3">
                ${p.price.toLocaleString("es-CL")}
              </div>
              <ul className="text-sm text-brand-700 space-y-1">
                <li>✓ Mejora IA incluida</li>
                <li>✓ Tapa dura · 30×30cm</li>
                <li>✓ Despacho a domicilio</li>
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
