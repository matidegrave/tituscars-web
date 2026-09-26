// Errores de JS que manda el navegador (ver lib/reporte-errores-script.ts).
// Se escriben en los runtime logs de Vercel con el prefijo [CLIENT-ERROR].
import { demasiadas, dentroDelLimite, ipDe } from "@/lib/rate-limit";
const CAMPOS = ["msg", "src", "line", "col", "stack", "ua", "url", "tipo"] as const;
const MAXIMO_BYTES = 10 * 1024;
const MAXIMO_CAMPO = 2000;

const vacia = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  // 10 reportes por minuto por IP; pasado eso, 429 sin loguear nada.
  if (!dentroDelLimite(`client-error:${ipDe(request)}`, 10, 60 * 1000)) return demasiadas();
  try {
    const texto = await request.text();
    if (texto.length > MAXIMO_BYTES) return vacia();

    const datos = JSON.parse(texto) as Record<string, unknown>;
    const registro: Record<string, string> = {};
    for (const campo of CAMPOS) {
      const valor = datos?.[campo];
      if (valor !== undefined && valor !== null) {
        registro[campo] = String(valor).slice(0, MAXIMO_CAMPO);
      }
    }
    console.error("[CLIENT-ERROR]", JSON.stringify(registro));
  } catch {
    // Cuerpo inválido: se ignora.
  }
  return vacia();
}
