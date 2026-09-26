import type { NextConfig } from "next";

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
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://www.google.com",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "report-uri /api/csp-report",
].join("; ");

const HEADERS_SEGURIDAD = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy-Report-Only", value: CSP },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: HEADERS_SEGURIDAD }];
  },
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
  images: {
    // Next 16 solo acepta las calidades de esta lista (por defecto [75]); una
    // que no esté se sirve con la más cercana. 50 es para las miniaturas.
    qualities: [50, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nfkrhkewfusvdxsyuggg.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Las redirecciones (URLs viejas de Tienda Nube, prefijos de idioma, barra
  // final y *.vercel.app -> tituscars.com) viven en src/proxy.ts: los
  // redirects de acá le pasan toda la query al destino sin poder filtrarla, y
  // la barra final la saca el proxy para que una URL vieja con barra resuelva
  // en un solo 308 (si no, Next hace un 308 propio antes y quedan dos).
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
