import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para las rutas /api que ESCRIBEN (web_eventos,
 * busquedas_web). Usa la publishable key: este proyecto no usa service_role
 * (decisión del 26/09/2026). El rate limit y la validación de esas rutas son
 * la capa de control.
 */
export const supabaseServidor = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
