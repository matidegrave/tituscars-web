import { cookies } from "next/headers";
import { COOKIE_ORIGEN } from "@/lib/origen";
import { numeroVentas } from "@/lib/whatsapp";

/** El WhatsApp de venta de esta visita, leyendo la cookie (páginas y layout). */
export async function numeroVentasServidor(): Promise<string> {
  return numeroVentas((await cookies()).get(COOKIE_ORIGEN)?.value);
}
