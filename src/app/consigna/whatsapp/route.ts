import { after } from "next/server";
import { WHATSAPP_CONSIGNAS } from "@/lib/config";
import { COTIZACION_VACIA, esModalidad, mensajeConsigna } from "@/lib/cotizacion";
import { enviarAMeta, guardarEvento } from "@/lib/eventos-servidor";
import { dentroDelLimite, ipDe } from "@/lib/rate-limit";
import { linkWhatsapp } from "@/lib/whatsapp";

// Formulario "Pedí tu cotización" de /consigna cuando el navegador no corre JS
// (con JS, el formulario abre WhatsApp directo y no pasa por acá). Arma el
// mismo mensaje que el formulario y redirige al WhatsApp de consignaciones.
// Es POST para que el nombre no quede en la URL ni en los logs de acceso.

const campo = (datos: FormData, nombre: string, max: number): string => {
  const valor = datos.get(nombre);
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
};

export async function POST(request: Request) {
  let datos: FormData;
  try {
    datos = await request.formData();
  } catch {
    return Response.redirect(new URL("/consigna", request.url), 303);
  }

  const modalidad = campo(datos, "modalidad", 10);
  const mensaje = mensajeConsigna({
    ...COTIZACION_VACIA,
    marca: campo(datos, "marca", 60),
    modelo: campo(datos, "modelo", 60),
    anio: campo(datos, "anio", 4).replace(/\D/g, ""),
    km: campo(datos, "km", 12),
    nombre: campo(datos, "nombre", 80),
    modalidad: esModalidad(modalidad) ? modalidad : "",
  });

  // Sin JS no corrió el Pixel ni /api/track: el lead se registra acá (tope de
  // 10 por minuto por IP para que un bot no llene web_eventos).
  if (dentroDelLimite(`consigna-wa:${ipDe(request)}`, 10, 60 * 1000)) {
    const evento = {
      event_id: crypto.randomUUID(),
      pagina: "/consigna",
      url: new URL("/consigna", request.url).toString(),
      referrer: request.headers.get("referer") ?? undefined,
      categoria: "consignacion",
    };
    after(() =>
      Promise.allSettled([guardarEvento("lead_form", evento), enviarAMeta("lead_form", evento, request)])
    );
  }

  return Response.redirect(linkWhatsapp(mensaje, WHATSAPP_CONSIGNAS), 303);
}

/** Un GET (recargar, link compartido) vuelve a la página del formulario. */
export function GET(request: Request) {
  return Response.redirect(new URL("/consigna", request.url), 303);
}
