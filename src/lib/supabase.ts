import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

/**
 * Tag del caché de todo lo que muestra el stock (autos y fotos: catalogo_publico).
 * La base de gestión avisa en el momento que cambia un auto
 * (POST /api/revalidate) y eso vence todo lo que tenga este tag: las páginas
 * se regeneran en la siguiente visita.
 */
export const TAG_STOCK = "stock";

/** Respaldo por si un aviso no llega: con el aviso no hace falta que sea corto. */
export const REVALIDAR_STOCK_S = 3600;

// Lecturas (GET/HEAD) al caché de datos de Next con el tag "stock"; lo demás
// (rpc, escrituras) pasa directo.
function fetchStock(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const metodo = (init?.method ?? "GET").toUpperCase();
  if (metodo !== "GET" && metodo !== "HEAD") return fetch(input, init);
  return fetch(input, { ...init, next: { tags: [TAG_STOCK], revalidate: REVALIDAR_STOCK_S } });
}

/** Cliente para leer el stock (lib/autos.ts): cada consulta queda bajo el tag "stock". */
export const supabaseStock = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: { fetch: fetchStock },
});
