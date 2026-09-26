// Configuración editable del sitio. Agustín: revisá y corregí estas
// constantes cuando tengas los datos reales — no hace falta tocar código,
// solo estos valores.

// URL pública del sitio (sin barra final): metadataBase, sitemap, robots y
// los JSON-LD la usan para armar URLs absolutas. En Vercel se define como
// variable de entorno NEXT_PUBLIC_SITE_URL; este default es sólo para no
// romper un build local sin esa variable.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tituscars.com").replace(
  /\/$/,
  ""
);

// Números de WhatsApp (sólo dígitos, formato wa.me). Vienen de variables de
// entorno de Vercel; ningún componente arma un número por su cuenta.
// - ventas: todo el sitio;
// - consignas: /consigna (si faltara la variable, cae en el de ventas).
export const WHATSAPP_VENTAS = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
export const WHATSAPP_CONSIGNAS = process.env.NEXT_PUBLIC_WHATSAPP_CONSIGNAS || WHATSAPP_VENTAS;

/** "5493515303698" -> "+54 9 351 530-3698" (celulares de Argentina, 13 dígitos). */
export function telefonoLegible(numero: string): string {
  const m = numero.match(/^(54)(9)(\d{3})(\d{3})(\d{4})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}-${m[5]}` : `+${numero}`;
}

// Reseñas de Google (bloque antes del footer y en /nosotros). Copiar los
// números tal cual figuran en el perfil de Google (al 23/09/2026: 4,8 con
// 195 reseñas); no redondear para arriba.
export const GOOGLE_PUNTAJE = "4,8";
export const RESENAS_CANTIDAD = 195;
export const RESENAS_URL = "https://maps.app.goo.gl/Vsu7RQMskAvEWuCm8";

// Redes sociales (footer, /nosotros, /contacto)
export const INSTAGRAM_URL = "https://www.instagram.com/titus.cars";
export const TIKTOK_URL = "https://www.tiktok.com/@titus.cars";
export const YOUTUBE_URL = "https://www.youtube.com/@titus.cars";

// Dirección y teléfono (footer, /contacto y el JSON-LD AutoDealer de la home)
export const DIRECCION_CALLE = "Av. Duarte Quirós 3996";
export const DIRECCION_LOCALIDAD = "Córdoba";
export const DIRECCION = `${DIRECCION_CALLE}, ${DIRECCION_LOCALIDAD}`;
export const TELEFONO_DISPLAY = "+54 9 351 328-3316";

// Horarios de atención (/contacto y el JSON-LD AutoDealer). El texto libre es
// lo que se muestra; el array de abajo es la MISMA info en el formato que
// pide schema.org para el JSON-LD — si HORARIOS cambia, actualizar los dos.
export const HORARIOS = "Lunes a viernes 9 a 18 hs · Sábados 9 a 13 hs";
export const HORARIOS_SCHEMA: { dayOfWeek: string[]; opens: string; closes: string }[] = [
  {
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "18:00",
  },
  { dayOfWeek: ["Saturday"], opens: "09:00", closes: "13:00" },
];

// Cantidad de autos vendidos históricos (bloque de números en /nosotros)
export const AUTOS_VENDIDOS = 400;

// Entidades de financiación (/financiacion): vacío hasta que Agustín pase
// nombre + logo de cada banco/financiera. La grilla no se muestra si está vacío.
export interface EntidadFinanciera {
  nombre: string;
  /** Ruta del logo dentro de /public, ej. "/financiacion/banco-x.png". */
  logo: string;
}
export const ENTIDADES: EntidadFinanciera[] = [];
