import { demasiadas, dentroDelLimite, ipDe } from "@/lib/rate-limit";

// Violaciones de la Content-Security-Policy (hoy en modo Report-Only, ver
// next.config): quedan en los runtime logs con el prefijo [CSP] para ajustar
// la política antes de pasarla a obligatoria. 20 por minuto por IP.

export async function POST(request: Request) {
  if (!dentroDelLimite(`csp:${ipDe(request)}`, 20, 60 * 1000)) return demasiadas();
  try {
    const texto = await request.text();
    if (texto.length <= 8 * 1024) {
      const cuerpo = JSON.parse(texto) as Record<string, unknown>;
      // Formato viejo (report-uri): { "csp-report": {...} }; nuevo (Reporting API): [{ body: {...} }]
      const reportes = Array.isArray(cuerpo) ? cuerpo.map((r) => r?.body) : [cuerpo["csp-report"]];
      for (const r of reportes) {
        if (!r || typeof r !== "object") continue;
        const d = r as Record<string, unknown>;
        console.warn(
          "[CSP]",
          JSON.stringify({
            directiva: d["violated-directive"] ?? d.effectiveDirective,
            bloqueado: d["blocked-uri"] ?? d.blockedURL,
            pagina: d["document-uri"] ?? d.documentURL,
          }).slice(0, 1000)
        );
      }
    }
  } catch {
    // cuerpo inválido: se ignora
  }
  return new Response(null, { status: 204 });
}
