"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "upload" | "enhance" | "design" | "done";

type FileItem = {
  id: string;
  name: string;
  url: string;
  originalPath: string;
  enhancedUrl?: string;
  enhancedPath?: string;
  provider?: string;
};

export default function EditorPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [title, setTitle] = useState("Nuestros recuerdos");
  const [subtitle, setSubtitle] = useState("2026");
  const [busy, setBusy] = useState(false);
  const [project, setProject] = useState<any>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setBusy(true);
    const form = new FormData();
    Array.from(e.target.files).forEach((f) => form.append("files", f));
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    setFiles((prev) => [...prev, ...data.files]);
    setBusy(false);
  }

  async function runEnhance() {
    setBusy(true);
    setStep("enhance");
    const res = await fetch("/api/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    });
    const data = await res.json();
    setFiles(data.files);
    setBusy(false);
  }

  async function runDesign() {
    setBusy(true);
    setStep("design");
    const res = await fetch("/api/design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        subtitle,
        files: files.map((f) => ({
          id: f.id,
          originalPath: f.originalPath,
          enhancedPath: f.enhancedPath,
        })),
      }),
    });
    const data = await res.json();
    setProject(data);
    setStep("done");
    setBusy(false);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-brand-600">
        {(["upload", "enhance", "design", "done"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                step === s
                  ? "bg-brand-600 text-white"
                  : i <= ["upload", "enhance", "design", "done"].indexOf(step)
                  ? "bg-brand-300 text-white"
                  : "bg-brand-100"
              }`}
            >
              {i + 1}
            </div>
            <span className="capitalize">{labelStep(s)}</span>
            {i < 3 && <div className="w-8 h-px bg-brand-300" />}
          </div>
        ))}
      </div>

      {step === "upload" && (
        <>
          <h1 className="display text-3xl font-bold text-brand-900">Sube tus fotos</h1>
          <p className="text-brand-700">
            Sugerencia: entre 20 y 40 fotos para un álbum balanceado.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Título del álbum</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-brand-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Subtítulo / Fecha</label>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full border border-brand-300 rounded px-3 py-2"
              />
            </div>
          </div>

          <label className="block cursor-pointer border-2 border-dashed border-brand-400 rounded-xl p-10 text-center bg-white hover:bg-brand-50">
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <div className="text-4xl mb-2">🖼️</div>
            <div className="text-brand-700">
              Arrastra tus fotos aquí o haz clic para seleccionar
            </div>
            <div className="text-xs text-brand-500 mt-1">JPG, PNG, HEIC · hasta 20MB c/u</div>
          </label>

          {files.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {files.map((f) => (
                <div key={f.id} className="relative group aspect-square bg-brand-100 rounded overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(f.id)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1 opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              disabled={busy || files.length < 1}
              onClick={runEnhance}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {busy ? "Cargando…" : `Mejorar calidad (${files.length} fotos) →`}
            </button>
          </div>
        </>
      )}

      {step === "enhance" && (
        <div className="text-center py-16">
          <div className="text-5xl animate-pulse">✨</div>
          <div className="display text-2xl mt-4 text-brand-800">
            Mejorando tus fotos con IA…
          </div>
          <div className="text-sm text-brand-600 mt-2">
            Esto puede tomar 30-90 segundos. Usamos Real-ESRGAN para aumentar resolución y detalle.
          </div>
          {!busy && (
            <button
              onClick={runDesign}
              className="mt-8 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg"
            >
              Diseñar álbum →
            </button>
          )}
        </div>
      )}

      {step === "design" && (
        <div className="text-center py-16">
          <div className="text-5xl animate-pulse">🎨</div>
          <div className="display text-2xl mt-4 text-brand-800">
            Armando tu álbum profesional…
          </div>
          <div className="text-sm text-brand-600 mt-2">
            Nuestro agente está componiendo portada, layouts y contraportada.
          </div>
        </div>
      )}

      {step === "done" && project && (
        <div className="space-y-6">
          <h1 className="display text-3xl font-bold text-brand-900">
            ¡Tu álbum está listo!
          </h1>
          <div className="bg-white border border-brand-200 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <iframe
                  src={project.pdfUrl}
                  className="w-full h-96 border border-brand-200 rounded"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-brand-500">Páginas</div>
                  <div className="text-2xl font-bold text-brand-800">{project.pageCount}</div>
                </div>
                <div>
                  <div className="text-sm text-brand-500">Precio</div>
                  <div className="text-3xl font-bold text-brand-700">
                    ${project.priceCLP.toLocaleString("es-CL")}
                  </div>
                </div>
                <div className="text-xs text-brand-500">
                  Diseño: {project.designProvider}
                </div>
                <a
                  href={project.pdfUrl}
                  target="_blank"
                  className="block text-center border border-brand-300 rounded-lg py-2 hover:bg-brand-50"
                >
                  Ver PDF completo
                </a>
                <button
                  onClick={() => router.push(`/checkout?projectId=${project.projectId}`)}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-3 font-medium"
                >
                  Comprar con despacho →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function labelStep(s: Step) {
  return s === "upload" ? "Subir" : s === "enhance" ? "Mejorar" : s === "design" ? "Diseñar" : "Listo";
}
