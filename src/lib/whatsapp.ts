import { WHATSAPP_CONSIGNAS, WHATSAPP_VENTAS } from "@/lib/config";

/**
 * Mensaje de consulta por un auto, estilo Mercado Libre: el link va solo en su
 * línea para que WhatsApp arme la vista previa con la foto del auto.
 */
export function mensajeConsultaAuto({
  titulo,
  anio,
  datos,
  url,
  conCita,
}: {
  titulo: string;
  anio: number;
  datos: string;
  url: string;
  conCita: boolean;
}): string {
  const lineas = [
    "Hola, ¿cómo estás? Me interesó este vehículo:",
    `🚗 ${titulo} ${anio}`,
    datos,
    url,
  ];
  if (conCita) lineas.push("¿Puedo coordinar una cita para verlo?");
  return lineas.join("\n");
}

/** Link a wa.me con el mensaje prearmado. Por defecto, al número de ventas. */
export function linkWhatsapp(
  mensaje = "Hola, consulto desde la web.",
  numero: string = WHATSAPP_VENTAS
): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export const MENSAJE_CONSIGNA = "Hola! Quiero consignar mi auto con Titus Cars.";

/** /consigna (y lo que cuelgue de ella) usa el WhatsApp de consignaciones. */
export function esRutaConsigna(pathname: string | null): boolean {
  return pathname === "/consigna" || Boolean(pathname?.startsWith("/consigna/"));
}

/**
 * Link de los botones generales (header, menú, flotante): en /consigna va al
 * número de consignas con su mensaje; en el resto, al de ventas con `mensaje`.
 */
export function linkWhatsappSegunRuta(pathname: string | null, mensaje?: string): string {
  return esRutaConsigna(pathname)
    ? linkWhatsapp(MENSAJE_CONSIGNA, WHATSAPP_CONSIGNAS)
    : linkWhatsapp(mensaje);
}
