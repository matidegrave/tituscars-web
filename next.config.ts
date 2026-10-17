import type { NextConfig } from "next";
import { origenesErp } from "./src/lib/informe-origenes";

// Versión del build: en Vercel, el commit; en local, la hora del build. Se
// graba en el bundle (cliente y servidor) y la usa el VersionGuard.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now());

// Content-Security-Policy: por ahora en modo Report-Only (no bloquea nada;
// las violaciones llegan a /api/csp-report y quedan en los logs con [CSP]).
// Cuando no aparezcan violaciones legítimas, pasar a Content-Security-Policy.
// 'unsafe-inline' en script-src: los scripts inline de Next, el snippet del
// Meta Pixel y el script ES5 de errores del <head>.
const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://nfkrhkewfusvdxsyuggg.supabase.co";
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE} https://www.facebook.com https://i.ytimg.com`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE} https://www.facebook.com https://connect.facebook.net`,
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://www.google.com https://www.instagram.com",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  // El formulario de /consigna sin JS postea acá y redirige a WhatsApp.
  "form-action 'self' https://wa.me https://api.whatsapp.com",
  // Nadie embebe la web en un iframe (ni ella misma): igual que X-Frame-Options DENY.
  "frame-ancestors 'none'",
  "report-uri /api/csp-report",
].join("; ");

const HEADERS_BASE = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const HEADERS_SEGURIDAD = [
  ...HEADERS_BASE,
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy-Report-Only", value: CSP },
];

// /informe/preview: la ÚNICA ruta embebible, desde el panel de revisión del ERP
// (contrato cerrado: src/lib/informe-preview.ts; orígenes en informe-origenes.ts). Sin X-Frame-Options y con
// una CSP APLICADA que sólo tiene frame-ancestors = los orígenes del ERP
// (+ http://localhost:3000 en `next dev`, nunca en producción). La CSP
// Report-Only de siempre va sin su frame-ancestors 'none' (si no, cada vista
// previa reportaría una violación).
const RUTA_PREVIEW = "/informe/preview";
const HEADERS_PREVIEW = [
  ...HEADERS_BASE,
  {
    key: "Content-Security-Policy",
    value: `frame-ancestors ${origenesErp(process.env.NODE_ENV === "development").join(" ")}`,
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: CSP.replace("frame-ancestors 'none'; ", ""),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    // En Next un header no se borra con otra regla: la global excluye la
    // vista previa (sólo esa ruta exacta) y la vista previa tiene la suya.
    return [
      { source: "/:path((?!informe/preview$).*)", headers: HEADERS_SEGURIDAD },
      { source: RUTA_PREVIEW, headers: HEADERS_PREVIEW },
    ];
  },
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
  images: {
    // Consumo de Image Optimization (se cobra por transformación y por
    // escritura en caché): cada combinación foto x ancho x formato x calidad
    // es una transformación, así que se usan las menos posibles.
    // - Sólo AVIF: una variante por ancho. El navegador que no acepta AVIF
    //   recibe la foto en su formato original (JPG), redimensionada.
    //   Next escala la calidad para AVIF (q75 -> AVIF 47), que se ve como el
    //   WebP q75 de antes y pesa ~45% menos.
    formats: ["image/avif"],
    // Una sola calidad (también las miniaturas).
    qualities: [75],
    // Sólo los anchos que la web usa de verdad: fotos de ficha/cards/hero
    // (640, 828, 1080; celu 3x y compu toman 1080) y chicas (miniaturas de
    // 80 px -> 160/256; cards en compu -> 384). El visor usa 828 y 1080.
    deviceSizes: [640, 828, 1080],
    imageSizes: [96, 160, 256, 384],
    // Las fotos de Supabase vienen con Cache-Control: no-cache, así que el
    // default de Next (4 h) las re-transformaba varias veces por día. 31 días:
    // una foto optimizada no se regenera (las fotos no cambian: al editar un
    // auto se suben con otro nombre).
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nfkrhkewfusvdxsyuggg.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Sin dangerouslyAllowSVG: los logos .svg se sirven directo (unoptimized
    // automático), sin pasar por el optimizador.
  },
  // Las redirecciones (URLs viejas de Tienda Nube, prefijos de idioma, barra
  // final y *.vercel.app -> tituscars.com) viven en src/proxy.ts: los
  // redirects de acá le pasan toda la query al destino sin poder filtrarla, y
  // la barra final la saca el proxy para que una URL vieja con barra resuelva
  // en un solo 308 (si no, Next hace un 308 propio antes y quedan dos).
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
