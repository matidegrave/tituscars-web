import { supabaseServidor } from "@/lib/supabase-servidor";
import { demasiadas, dentroDelLimite, ipDe } from "@/lib/rate-limit";

// Formulario "Te buscamos tu auto a medida": valida en el servidor y guarda
// en busquedas_web. Rate limit: 3 envíos cada 10 minutos por IP.

const MAXIMO_BYTES = 8 * 1024;

const ok = () => Response.json({ ok: true });
const invalido = (campo: string) =>
  Response.json({ error: `Dato inválido: ${campo}` }, { status: 400 });

type Cuerpo = Record<string, unknown>;

/** Texto opcional: null si viene vacío; undefined si se pasa del largo (inválido). */
function textoOpcional(v: unknown, max: number): string | null | undefined {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (!t) return null;
  return t.length > max ? undefined : t;
}

function numeroOpcional(v: unknown, min: number, max: number): number | null | undefined {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

export async function POST(request: Request) {
  if (!dentroDelLimite(`busqueda:${ipDe(request)}`, 3, 10 * 60 * 1000)) return demasiadas();

  let c: Cuerpo;
  try {
    const texto = await request.text();
    if (texto.length > MAXIMO_BYTES) return invalido("tamaño");
    c = JSON.parse(texto) as Cuerpo;
  } catch {
    return invalido("formato");
  }

  // Honeypot lleno: es un bot. Se responde OK sin guardar nada.
  if (typeof c.web === "string" && c.web.trim() !== "") return ok();

  const nombre = typeof c.nombre === "string" ? c.nombre.trim() : "";
  if (nombre.length < 2 || nombre.length > 80) return invalido("nombre");

  // Celular: sólo dígitos (se aceptan espacios, guiones, paréntesis y + al
  // escribirlo, y se guardan sólo los dígitos), de 8 a 15.
  const celularCrudo = typeof c.celular === "string" ? c.celular.trim() : "";
  if (!/^[\d\s()+-]+$/.test(celularCrudo)) return invalido("celular");
  const celular = celularCrudo.replace(/\D/g, "");
  if (celular.length < 8 || celular.length > 15) return invalido("celular");

  const modelos = textoOpcional(c.modelos_buscados, 300);
  const entregaModelo = textoOpcional(c.entrega_modelo, 120);
  const observaciones = textoOpcional(c.observaciones, 1000);
  const pagina = textoOpcional(c.pagina, 300);
  const autoSlug = textoOpcional(c.auto_slug, 200);
  const entregaAnio = numeroOpcional(c.entrega_anio, 1950, 2100);
  const entregaKm = numeroOpcional(c.entrega_km, 0, 2_000_000);
  const presupuesto = numeroOpcional(c.presupuesto_max, 1, 1_000_000_000_000);

  for (const [campo, valor] of Object.entries({
    modelos_buscados: modelos,
    entrega_modelo: entregaModelo,
    observaciones,
    pagina,
    auto_slug: autoSlug,
    entrega_anio: entregaAnio,
    entrega_km: entregaKm,
    presupuesto_max: presupuesto,
  })) {
    if (valor === undefined) return invalido(campo);
  }

  const entrega = c.entrega_vehiculo === true;
  const { error } = await supabaseServidor.from("busquedas_web").insert({
    nombre,
    celular,
    modelos_buscados: modelos,
    entrega_vehiculo: entrega,
    entrega_modelo: entrega ? entregaModelo : null,
    entrega_anio: entrega ? entregaAnio : null,
    entrega_km: entrega ? entregaKm : null,
    financia: c.financia === true,
    contado: c.contado === true,
    presupuesto_max: presupuesto,
    observaciones,
    pagina,
    auto_slug: autoSlug,
  });
  if (error) {
    console.error("[BUSQUEDA] busquedas_web", error.message);
    return Response.json({ error: "No se pudo guardar" }, { status: 500 });
  }
  return ok();
}
