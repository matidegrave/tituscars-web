import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para las rutas /api que ESCRIBEN (web_eventos,
 * busquedas_web). Usa SUPABASE_SERVICE_ROLE_KEY si está cargada en el entorno
 * (nunca NEXT_PUBLIC_: no llega al navegador); si no, la publishable key.
 *
 * Con la service key cargada se le puede sacar el INSERT a anon en esas
 * tablas, y entonces el rate limit y la validación de estas rutas pasan a ser
 * el ÚNICO camino para escribir.
 */
export const supabaseServidor = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
