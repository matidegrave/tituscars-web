/**
 * /nosotros (tanda 44): la historia de Titus contada con sus reels de
 * Instagram, en orden. Se embeben sólo con el ID
 * (https://www.instagram.com/{t}/{id}/embed/), aunque el reel sea de otra
 * cuenta. t: "reel" o "p" (post).
 */

export interface VideoInstagram {
  t: "reel" | "p";
  id: string;
}

export interface Capitulo {
  fecha: string;
  titulo: string;
  videos: VideoInstagram[];
  /** Link de texto chico debajo de los videos (ej. un reel que no se reproduce embebido). */
  extra?: { texto: string; url: string };
}

export const HISTORIA: Capitulo[] = [
  { fecha: "Sep 2023", titulo: "Nuestro primer video y el primer auto que compramos, donde empezó todo", videos: [{ t: "reel", id: "CxQyeFpJZZH" }] },
  { fecha: "Abr 2024", titulo: "Nuestro primer gran viral", videos: [{ t: "reel", id: "C54bPKOLmZp" }] },
  { fecha: "Abr 2024", titulo: "Nuestra primera agencia. ¡No saben lo que renegamos con esa oficina!", videos: [{ t: "reel", id: "C6CwIf4NUVM" }, { t: "reel", id: "C6SEJN0Pr87" }] },
  { fecha: "Oct 2024", titulo: "Duró poco el baldío/agencia, así que salimos a buscar algo mejor", videos: [{ t: "reel", id: "DBAJU1ovnQG" }, { t: "reel", id: "DBr53PPPBX6" }] },
  { fecha: "Nov 2024", titulo: "¡Primer contrato de alquiler!", videos: [{ t: "reel", id: "DCkcuRlvrm1" }] },
  { fecha: "Dic 2024", titulo: "Primer patrocinio de Titus, con un fiel amigo y cliente", videos: [{ t: "reel", id: "DDdK8OARWVK" }] },
  { fecha: "Ene 2025", titulo: "Tuvimos un pequeño incidente: Agus se cayó de la moto y les dejamos el vivo contando todo", videos: [{ t: "reel", id: "DE0ugm9vlC4" }] },
  { fecha: "Feb 2025", titulo: "¡Por fin nos toca mudarnos!", videos: [{ t: "reel", id: "DF6NfN9POG2" }] },
  { fecha: "Jun 2025", titulo: "Una gran experiencia en equipo: fuimos a ver a un grande de la venta de autos, @alvarooroza", videos: [{ t: "reel", id: "DLisLIZvJ09" }] },
  { fecha: "Mar 2026", titulo: "La agencia no podía parecer un hospital, así que le dimos la calidez que necesitaba", videos: [{ t: "reel", id: "DVjlwfQkfUP" }], extra: { texto: "Mirá cómo lo diseñó @somoslimonestudio →", url: "https://www.instagram.com/somoslimonestudio/reel/DVzRYaMj1VI/" } },
  { fecha: "May 2026", titulo: "Un gran esfuerzo, una nueva mudanza, pero el local soñado", videos: [{ t: "reel", id: "DX0A2B1NNnk" }] },
  { fecha: "Jun 2026", titulo: "Apuntamos al futuro y creemos que la IA lo es", videos: [{ t: "reel", id: "DZa7cwURYy0" }] },
  { fecha: "Jul 2026", titulo: "¡Se cumplen 7 años de la compra del primer auto!", videos: [{ t: "reel", id: "DbeG_y6Cod-" }] },
  { fecha: "Ago 2026", titulo: "Lo logramos, ¡y vamos por mucho más!", videos: [{ t: "p", id: "DckHI-GDePY" }] },
  { fecha: "Sep 2026", titulo: "¡El primer chino 0km vendido en Titus!", videos: [{ t: "reel", id: "Ddr6UMTjFPR" }] },
];

export const DIVERSION: VideoInstagram[] = [
  { t: "reel", id: "DRDgTR1Dc7J" },
  { t: "reel", id: "DVpBNC3jXWf" },
  { t: "reel", id: "DZ8PcbTCrcD" },
  { t: "reel", id: "DdufFlwAjc5" },
  { t: "reel", id: "DdxFF4RBNEP" },
];

export const urlInstagram = (v: VideoInstagram) => `https://www.instagram.com/${v.t}/${v.id}/`;
export const urlEmbed = (v: VideoInstagram) => `https://www.instagram.com/${v.t}/${v.id}/embed/`;
