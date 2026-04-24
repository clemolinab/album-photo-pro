# 📸 Album Photo Pro

MVP full-stack para vender álbumes fotográficos con mejora de imágenes por IA, diseño automático y despacho a domicilio.

## Flujo completo

```
Usuario sube fotos  →  IA mejora calidad (Replicate + Real-ESRGAN)
    ↓
Agente arma álbum PDF profesional (pdf-lib, opcionalmente Canva)
    ↓
Usuario paga con Mercado Pago
    ↓
Webhook actualiza la orden a "paid"
    ↓
Admin descarga el PDF imprenta y manda a imprimir → despacho
```

## Stack

- **Next.js 14** (App Router) — frontend + backend en un solo proyecto
- **Tailwind CSS** — estilos
- **Replicate** (`nightmareai/real-esrgan`) — mejora de imágenes (x4 + face enhance)
- **Canva Connect API** — diseño profesional (opcional)
- **pdf-lib + sharp** — generador de PDF imprenta (fallback y preview)
- **Mercado Pago** — pagos en CLP (Webpay, tarjetas, transferencia)
- **JSON file DB** — para MVP (cambiar a Postgres en producción)

## Estructura

```
album-photo-pro/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Home (landing)
│   │   ├── editor/page.tsx        # Subir fotos → mejorar → diseñar
│   │   ├── checkout/page.tsx      # Datos de despacho + pago
│   │   ├── success/page.tsx       # Gracias
│   │   ├── admin/page.tsx         # Panel vendedor
│   │   └── api/
│   │       ├── upload/            # Subida de fotos
│   │       ├── enhance/           # Llama a Replicate
│   │       ├── design/            # Genera PDF álbum
│   │       ├── checkout/          # Crea preferencia MP
│   │       ├── webhook/           # Recibe notificaciones MP
│   │       └── admin/             # CRUD órdenes
│   ├── lib/
│   │   ├── replicate.ts           # Real-ESRGAN + fallback sharp
│   │   ├── canva.ts               # Canva OAuth + Autofill + Export
│   │   ├── pdf.ts                 # Armador de álbum PDF
│   │   ├── mercadopago.ts         # Preferencias MP
│   │   ├── db.ts                  # JSON DB
│   │   └── pricing.ts             # Cálculo de precios
└── data/                           # orders.json, projects.json (autocreado)
└── public/
    ├── uploads/                    # Fotos originales
    ├── enhanced/                   # Fotos mejoradas
    └── albums/                     # PDFs generados
```

## Instalación

```bash
cd album-photo-pro
npm install
cp .env.example .env.local
# Edita .env.local con tus credenciales
npm run dev
```

Abre http://localhost:3000

## Configuración de APIs

### 1. Replicate (mejora de imágenes)

1. Crea cuenta en https://replicate.com
2. Ve a https://replicate.com/account/api-tokens
3. Genera un token y pégalo en `.env.local`:
   ```
   REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Costo aproximado**: ~US$0.001 por imagen (Real-ESRGAN x4). Un álbum de 30 fotos cuesta ~3 centavos de dólar en mejora IA.

Si no configuras Replicate, el sistema usa `sharp` como fallback local gratis (upscaling básico + sharpen).

### 2. Canva Connect API (opcional, diseño premium)

Canva requiere aprobación de la app:

1. Crea una cuenta Canva Developer: https://www.canva.dev/docs/connect/
2. Crea una app → OAuth 2.0
3. Configura scopes: `design:content:read/write`, `asset:read/write`, `brandtemplate:*`
4. Crea un **brand template** con placeholders de imagen (`imagen_1`, `imagen_2`, etc.)
5. Copia `CLIENT_ID`, `CLIENT_SECRET` y el `BRAND_TEMPLATE_ID` a `.env.local`

**Si no configuras Canva**, el sistema usa el generador PDF local (`src/lib/pdf.ts`), que ya produce álbumes profesionales listos para imprenta (A4 apaisado, portada, layouts alternados, contraportada).

### 3. Mercado Pago (pagos)

1. Ve a https://www.mercadopago.cl/developers/panel
2. Crea una aplicación
3. Copia `Access Token` y `Public Key` a `.env.local`:
   ```
   MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxx
   MP_PUBLIC_KEY=APP_USR-xxxxxxxxxxxx
   ```
4. En la configuración de la app, registra el webhook apuntando a:
   `https://tu-dominio.com/api/webhook`

**Modo demo**: si no configuras MP, el botón de compra redirige directamente a `/success` sin procesar pago real — ideal para mostrar la idea.

## Uso — cliente

1. Entra a `/` y haz clic en **Crear mi álbum**
2. Sube de 20 a 40 fotos
3. La IA las mejora (toma 30-90s)
4. Se genera automáticamente el PDF del álbum con portada + layouts
5. Revisa el preview y haz clic en **Comprar con despacho**
6. Completa los datos de despacho → paga con Mercado Pago
7. Recibe confirmación por email

## Uso — vendedor (tú)

1. Entra a `/admin` con la clave en `ADMIN_PASSWORD`
2. Verás todas las órdenes con estado `paid`
3. Haz clic en **Descargar PDF imprenta** para cada orden
4. Envíalo a tu laboratorio de impresión (Rocio, ProFotoPrint, FotoStudio, etc.)
5. Cambia el estado: `paid` → `in_production` → `printed` → `shipped` → `delivered`
6. El cliente ve el estado actualizado (implementable con email o SMS)

## El "agente"

El agente en este proyecto está implementado como una **orquestación de APIs** en los endpoints backend:

- `/api/upload` — recibe y almacena imágenes
- `/api/enhance` — llama a Replicate para cada imagen (paralelo)
- `/api/design` — combina resultados + genera PDF (y/o Canva)
- `/api/checkout` — crea preferencia de pago

En producción puedes transformarlo en un agente "real" con **Claude Agent SDK** o **Anthropic API tool use** para tomar decisiones más inteligentes (p. ej. elegir layout según composición de las fotos, descartar fotos borrosas, sugerir subtítulos, etc.). Ver sección "Evolución a agente IA" abajo.

## Evolución a agente IA real

Para convertir esto en un agente autónomo con Claude:

```ts
// lib/agent.ts (pseudocódigo)
import Anthropic from "@anthropic-ai/sdk";

const tools = [
  { name: "enhance_image", ... },
  { name: "choose_layout", ... },
  { name: "generate_caption", ... },
  { name: "compose_album", ... },
];

const client = new Anthropic();
await client.messages.create({
  model: "claude-sonnet-4-6",
  tools,
  messages: [{ role: "user", content: "Arma un álbum de bodas con estas 40 fotos." }],
});
```

Claude decidirá cuándo llamar cada tool, puede razonar sobre la calidad de las fotos, detectar caras, elegir layouts editoriales y generar subtítulos o textos para cada página.

## Despliegue

**Vercel (recomendado)**:

```bash
npm i -g vercel
vercel
```

En el dashboard de Vercel agrega las variables de entorno (`REPLICATE_API_TOKEN`, `MP_ACCESS_TOKEN`, etc.). El webhook de MP debe apuntar al dominio de producción.

**Nota sobre almacenamiento**: la DB en JSON y los archivos en `/public` no persisten en Vercel entre deploys. Para producción, migra a:
- **DB**: Postgres (Supabase, Neon) + Prisma
- **Archivos**: Cloudinary, S3 o Vercel Blob

## Próximos pasos sugeridos

1. Conectar Postgres + Prisma para persistencia real
2. Cloudinary para hosting de imágenes (incluye CDN + transformaciones)
3. Email transaccional con Resend (confirmación + tracking)
4. Edición manual del álbum (drag-drop para reordenar fotos)
5. Integrar Claude como agente: selección automática de portada, subtítulos IA
6. Impresión directa vía API de la imprenta (si tu proveedor la ofrece)

## Licencia

MIT — úsalo libremente para tu negocio.
