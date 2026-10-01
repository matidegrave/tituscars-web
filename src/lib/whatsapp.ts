import { WHATSAPP_CONSIGNAS, WHATSAPP_VENTAS } from "@/lib/config";

/**
 * Mensaje de consulta por un auto, en una línea: "Hola, ¿cómo estás? Me
 * interesó este vehículo: TÍTULO AÑO — km · combustible · precio — link".
 * Sin emojis: en Kommo algunos llegaban como "�". Si el auto se ve con cita
 * previa, la pregunta va en una segunda línea.
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
  const linea = [`Hola, ¿cómo estás? Me interesó este vehículo: ${titulo} ${anio}`, datos, url]
    .filter(Boolean)
    .join(" — ");
  return conCita ? `${linea}\n¿Puedo coordinar una cita para verlo?` : linea;
}

/**
 * Saca emojis (y sus modificadores) de un mensaje: algunos llegan a Kommo como
 * "�". Cubre también lo que el cliente escribe en los formularios.
 */
export function sinEmojis(texto: string): string {
  return texto
    // El emoji y el espacio que lo precede ("Juan 👍." -> "Juan.").
    .replace(/[ \t]*[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]+/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +\n/g, "\n")
    .trim();
}

/**
 * El mensaje del WhatsApp general (tanda 47c): botón del encabezado, menú,
 * círculo flotante, footer, /contacto, /nosotros. Uno solo para toda la web.
 */
export const MENSAJE_GENERAL = "Hola, ¿cómo estás? Estuve viendo el catálogo web y quería hacer una consulta.";

/** Link a wa.me con el mensaje prearmado. Por defecto, el general al número de ventas. */
export function linkWhatsapp(
  mensaje = MENSAJE_GENERAL,
  numero: string = WHATSAPP_VENTAS
): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(sinEmojis(mensaje))}`;
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
