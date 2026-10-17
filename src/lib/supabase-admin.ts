import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la clave de servicio, SÓLO para las inserciones del
 * servidor en web_eventos (lib/eventos-servidor.ts: /api/track y
 * /consigna/whatsapp) y busquedas_web (/api/busqueda-a-medida). Todo lo demás
 * usa la clave pública (lib/supabase.ts).
 *
 * Decisión del 17/10/2026 (reemplaza la del 26/09 "sin service_role"): anon
 * deja de tener INSERT en esas dos tablas, así nadie con la clave pública
 * saltea el rate limit y la validación de las rutas. La clave es una secret
 * key (sb_secret_) propia de la web, revocable sin tocar gestión, cargada en
 * Vercel sólo en Production como SUPABASE_SERVICE_ROLE_KEY (sin NEXT_PUBLIC:
 * nunca llega al navegador; "server-only" rompe el build si un componente de
 * cliente importa este archivo).
 *
 * Sin la variable (local, previews) devuelve null: ahí las rutas no escriben
 * igual (lib/entorno.ts, [SIMULADO]).
 */
let cliente: SupabaseClient | null | undefined;

export function supabaseAdmin(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cliente = url && clave ? createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return cliente;
}
