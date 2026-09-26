/**
 * Rate limit por IP, en memoria (ventana deslizante). No hay KV/Upstash en el
 * proyecto: cada instancia de la función lleva su propia cuenta, así que el
 * límite es "por instancia" (con Fluid compute las requests se reparten entre
 * pocas instancias; alcanza para frenar un bot que martilla un endpoint).
 */

const ventanas = new Map<string, number[]>();
const MAXIMO_CLAVES = 20_000;

/** true si la request entra; false si ya se pasó del límite (responder 429). */
export function dentroDelLimite(clave: string, maximo: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const desde = ahora - ventanaMs;
  const recientes = (ventanas.get(clave) ?? []).filter((t) => t > desde);

  if (recientes.length >= maximo) {
    ventanas.set(clave, recientes);
    return false;
  }
  recientes.push(ahora);
  ventanas.set(clave, recientes);

  // Que el mapa no crezca sin fin: se tiran las claves sin actividad reciente.
  if (ventanas.size > MAXIMO_CLAVES) {
    for (const [k, v] of ventanas) if ((v[v.length - 1] ?? 0) < desde) ventanas.delete(k);
  }
  return true;
}

/** IP del cliente. En Vercel x-real-ip / x-forwarded-for los pone la plataforma. */
export function ipDe(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "desconocida"
  );
}

export const demasiadas = () =>
  new Response(JSON.stringify({ error: "Demasiadas solicitudes" }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": "60" },
  });
