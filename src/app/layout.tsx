import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Album Photo Pro — álbumes fotográficos con IA",
  description:
    "Sube tus fotos, nuestro agente IA las mejora y diseña tu álbum profesional con despacho a domicilio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <header className="border-b border-brand-200 bg-white/70 backdrop-blur sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">📸</span>
              <span className="display text-xl font-bold text-brand-800">
                Album Photo Pro
              </span>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:text-brand-600">Inicio</Link>
              <Link href="/editor" className="hover:text-brand-600">Crear álbum</Link>
              <Link href="/admin" className="hover:text-brand-600 text-brand-500">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-5 py-8">{children}</main>
        <footer className="border-t border-brand-200 mt-16 py-6 text-center text-sm text-brand-700">
          © {new Date().getFullYear()} Album Photo Pro · Hecho con Next.js + IA
        </footer>
      </body>
    </html>
  );
}
