import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { TAG_STOCK } from "@/lib/supabase";

// Aviso de la base de gestión cuando cambia algo visible de un auto (precio,
// estado, datos, fotos, alta, baja…): POST con el header x-revalidate-secret
// (= REVALIDATE_SECRET, cargado en Vercel) y body
// { "dominio": "AB123CD" | null, "motivo": "auto actualizado" | … }.
// Vence todo lo que tenga el tag "stock" (lecturas de lib/autos.ts) con
// expire 0: la siguiente visita de cada página ya sale con los datos nuevos.
export const dynamic = "force-dynamic";

/** Comparación en tiempo constante (sobre el hash: timingSafeEqual pide el mismo largo). */
function secretoValido(recibido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recibido) return false;
  const h = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(h(recibido), h(esperado));
}

export async function POST(request: Request) {
  if (!secretoValido(request.headers.get("x-revalidate-secret"))) {
    return Response.json({ ok: false }, { status: 401 });
  }

  // Sólo para el log (nunca el secreto): qué auto y por qué.
  let detalle = "";
  try {
    const c = (await request.json()) as { dominio?: unknown; motivo?: unknown };
    const texto = (v: unknown) => (typeof v === "string" ? v.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 40) : "");
    detalle = [texto(c.dominio), texto(c.motivo)].filter(Boolean).join(" · ");
  } catch {
    // Body vacío o no JSON: igual se revalida.
  }

  revalidateTag(TAG_STOCK, { expire: 0 });
  console.log("[REVALIDATE] stock", detalle);
  return Response.json({ ok: true });
}
