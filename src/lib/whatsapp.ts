import { WHATSAPP_CONSIGNAS, WHATSAPP_PAUTA, WHATSAPP_VENTAS } from "@/lib/config";
import { esPauta } from "@/lib/origen";

/**
 * El WhatsApp de venta para esta visita (tanda 51): el de pauta si llegó por
 * un anuncio (cookie tc_origen=pauta, lib/origen.ts), si no el de ventas de
 * siempre (portales). ÚNICO lugar que decide el número de venta: el servidor
 * lo llama con la cookie (lib/whatsapp-servidor.ts) y los componentes de
 * cliente lo reciben ya resuelto del layout (components/linea-whatsapp.tsx),
 * así el link sale bien en el HTML, sin JS. Consignas no pasa por acá.
 */
export function numeroVentas(valorCookieOrigen: string | null | undefined): string {
  return esPauta(valorCookieOrigen) ? WHATSAPP_PAUTA : WHATSAPP_VENTAS;
}

export type LineaWhatsapp = "pauta" | "portales";

/** Línea de un número (para medir): pauta, portales (ventas) o null (consignas u otro). */
export function lineaDeNumero(numero: string): LineaWhatsapp | null {
  if (numero === WHATSAPP_PAUTA) return "pauta";
  if (numero === WHATSAPP_VENTAS) return "portales";
  return null;
}

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

/**
 * Link a wa.me con el mensaje prearmado. El número va siempre explícito: el de
 * venta sale de numeroVentas() (sin default, para que nada caiga en portales
 * por olvido).
 */
export function linkWhatsapp(numero: string, mensaje = MENSAJE_GENERAL): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(sinEmojis(mensaje))}`;
}

export const MENSAJE_CONSIGNA = "Hola! Quiero consignar mi auto con Titus Cars.";

/** /consigna (y lo que cuelgue de ella) usa el WhatsApp de consignaciones. */
export function esRutaConsigna(pathname: string | null): boolean {
  return pathname === "/consigna" || Boolean(pathname?.startsWith("/consigna/"));
}

/**
 * Link de los botones generales (header, menú, flotante, footer): en /consigna
 * va al número de consignas con su mensaje; en el resto, al de venta
 * (`numero`, de numeroVentas()) con `mensaje`.
 */
export function linkWhatsappSegunRuta(pathname: string | null, numero: string, mensaje?: string): string {
  return esRutaConsigna(pathname)
    ? linkWhatsapp(WHATSAPP_CONSIGNAS, MENSAJE_CONSIGNA)
    : linkWhatsapp(numero, mensaje);
}
