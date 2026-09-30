import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_EQUIPO, UN_ANIO_S, valorEquipo } from "@/lib/equipo";

/**
 * Router de la web antes de renderizar. En orden:
 *
 * 1. Host: en producción, los *.vercel.app redirigen a tituscars.com (mismo
 *    path y query) para no competir con el dominio en Google. Los previews de
 *    ramas (VERCEL_ENV=preview) no se tocan.
 * 1b. ?equipo=1 / ?equipo=0: marca (o desmarca) el dispositivo como del equipo
 *    (no se mide) y vuelve a la misma URL sin el parámetro.
 * 2. Barra final: se saca acá (next.config tiene skipTrailingSlashRedirect)
 *    para que una URL vieja con barra resuelva en UN solo 308 y no en dos.
 * 3. Prefijo de idioma de Tienda Nube (/us/, /es/, …): se saca y se aplican
 *    las mismas reglas.
 * 4. URLs viejas de Tienda Nube: 308 a lo equivalente acá, SIN arrastrar su
 *    query (variant, utm, page, sort_by…). /search conserva sólo ?q=. Van acá
 *    y no en next.config porque aquellos redirects pasan toda la query.
 * 5. Cualquier otra ruta que no sea de esta web: 308 a /autos (URL vieja de
 *    Tienda Nube que no está en la lista). Nunca 404.
 * 6. Si sólo cambió la barra o el prefijo: 308 a la ruta limpia.
 * 7. Fichas de auto (/autos/:slug), ver resolverFicha.
 */

const DOMINIO = "https://tituscars.com";
const IDIOMA = /^\/(us|es|en|br|pt|ar)(?=\/|$)/;

type Regla = {
  prefijo: string;
  destino: string;
  /** Conserva ?q= (la búsqueda del catálogo). */
  conQ?: boolean;
  /** Sólo la ruta exacta, no lo que cuelga de ella. */
  exacta?: boolean;
};

/** Una categoría vieja (sólo la ruta exacta) -> /autos con ese filtro. */
function categorias(nombres: string[], filtro: string): Regla[] {
  return nombres.map((n) => ({ prefijo: `/${n}`, destino: `/autos?${filtro}`, exacta: true }));
}

/** Una categoría vieja (sólo la ruta exacta) -> su página /usados/... (tanda 42). */
function aUsados(nombres: string[], pagina: string): Regla[] {
  return nombres.map((n) => ({ prefijo: `/${n}`, destino: `/usados/${pagina}`, exacta: true }));
}

const REDIRECCIONES: Regla[] = [
  // Tienda Nube
  { prefijo: "/productos", destino: "/autos" },
  { prefijo: "/search", destino: "/autos", conQ: true },
  { prefijo: "/categorias", destino: "/autos" },
  { prefijo: "/categoria", destino: "/autos" },
  { prefijo: "/comprar", destino: "/autos" },
  { prefijo: "/carrito", destino: "/autos" },
  { prefijo: "/cart", destino: "/autos" },
  { prefijo: "/checkout", destino: "/autos" },
  { prefijo: "/account", destino: "/" },
  { prefijo: "/mi-cuenta", destino: "/" },
  // Categorías de Tienda Nube -> su página /usados/... (tanda 42) si tiene
  // una; si no, el mismo filtro en /autos. Sedán y hatchback son "autos"; las
  // pick-ups, "camionetas". Singular y plural.
  ...aUsados(["camionetas", "camioneta", "pickups", "pickup", "pick-ups", "pick-up"], "camionetas"),
  ...aUsados(["suv", "suvs"], "suv"),
  ...aUsados(["utilitarios", "utilitario"], "utilitarios"),
  ...categorias(["motos", "moto"], "carroceria=moto"),
  ...aUsados(["sedan", "sedanes", "hatchback", "hatchbacks"], "autos"),
  ...categorias(["usados", "autos-usados", "usado"], "condicion=usado"),
  ...categorias(["0-km", "autos-0km", "nuevos"], "condicion=0km"),
  // /0km es la ruta vieja de ESTA web (tanda 1c/3), por si quedó indexada.
  { prefijo: "/0km", destino: "/autos?condicion=0km", exacta: true },
  // Titus no compra autos: el que quiere vender va a consigna (tanda 2).
  { prefijo: "/vende-tu-auto", destino: "/consigna", exacta: true },
];

/**
 * URL absoluta en este mismo host. No se usa request.nextUrl.clone(): NextURL
 * recuerda si la URL original tenía barra final y se la vuelve a poner al
 * destino (/autos/ en vez de /autos).
 */
function urlDestino(request: NextRequest, pathname: string, search = ""): URL {
  return new URL(`${pathname}${search}`, request.url);
}

function redireccion(request: NextRequest, pathname: string): NextResponse | null {
  const regla = REDIRECCIONES.find(
    (r) => pathname === r.prefijo || (!r.exacta && pathname.startsWith(`${r.prefijo}/`))
  );
  if (!regla) return null;

  const [ruta, query] = regla.destino.split("?");
  const destino = urlDestino(request, ruta, query ? `?${query}` : "");
  const q = regla.conQ ? request.nextUrl.searchParams.get("q")?.trim() : "";
  if (q) destino.searchParams.set("q", q);
  return NextResponse.redirect(destino, 308);
}

// ─── Fichas ────────────────────────────────────────────────────────────────────
//
// - slug que existe: sigue a la página normal;
// - slug viejo (se editó el auto: cambia marca/modelo/versión/año pero no los
//   6 caracteres finales, que son el inicio del id): 308 al slug actual;
// - slug que no existe más: reescribe a una ruta inexistente para que Next
//   sirva el 404 raíz (app/not-found.tsx) renderizado en el servidor, con
//   status 404. Un notFound() tirado desde la página, en cambio, sale como un
//   documento vacío que arma el cliente (pantalla en blanco sin JS).
// El slug viaja en x-ficha-slug para que el 404 ofrezca autos parecidos.

const RUTA_404 = "/ficha-no-disponible";
const VIGENCIA_MS = 60 * 1000;

type AutoSlug = { id: string; slug: string };

// Lista de slugs vigentes en memoria por 60 s, para no sumar una consulta en
// cada visita. Si un slug no está, se vuelve a consultar antes de decidir (un
// auto recién publicado no puede dar 404).
let cache: { autos: AutoSlug[]; hasta: number } | null = null;

async function slugsVigentes(forzar: boolean): Promise<AutoSlug[] | null> {
  if (!forzar && cache && cache.hasta > Date.now()) return cache.autos;
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/catalogo_publico?select=id,slug&estado=neq.senado`;
    const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const res = await fetch(url, {
      headers: { apikey: clave, Authorization: `Bearer ${clave}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const autos = (await res.json()) as AutoSlug[];
    cache = { autos, hasta: Date.now() + VIGENCIA_MS };
    return autos;
  } catch {
    return null;
  }
}

async function resolverFicha(request: NextRequest, slug: string): Promise<NextResponse> {
  const headers = new Headers(request.headers);
  headers.set("x-ficha-slug", slug.slice(0, 200));
  const seguir = () => NextResponse.next({ request: { headers } });

  let autos = await slugsVigentes(false);
  if (autos && !autos.some((a) => a.slug === slug)) autos = await slugsVigentes(true);
  // Sin datos (Supabase caído): que la página resuelva como siempre.
  if (!autos) return seguir();
  if (autos.some((a) => a.slug === slug)) return seguir();

  const sufijo = slug.match(/-([0-9a-f]{6})$/i)?.[1]?.toLowerCase();
  if (sufijo) {
    const candidatos = autos.filter(
      (a) => a.slug.endsWith(`-${sufijo}`) && a.id.startsWith(sufijo)
    );
    if (candidatos.length === 1) {
      return NextResponse.redirect(urlDestino(request, `/autos/${candidatos[0].slug}`), 308);
    }
  }

  return NextResponse.rewrite(urlDestino(request, RUTA_404), { request: { headers } });
}

// ─── Rutas propias ─────────────────────────────────────────────────────────────
//
// Lo que sirve esta web. Todo lo demás es una URL vieja (paso 5). Los archivos
// (con extensión: robots.txt, sitemap.xml, /brand/logo.png, /reels/x.mp4…)
// siempre pasan.
const RUTAS_PROPIAS =
  /^\/(?:$|autos(?:\/[^/]+)?$|consigna(?:\/whatsapp)?$|contacto$|financiacion$|nosotros$|links$|favoritos$|usados\/[a-z0-9]+(?:-[a-z0-9]+)*$|ficha-no-disponible$|api\/|_next\/|_vercel\/|\.well-known\/)/;

function esRutaPropia(pathname: string): boolean {
  return RUTAS_PROPIAS.test(pathname) || /\.[a-z0-9]+$/i.test(pathname);
}

// ─── Los crawlers en los filtros (tandas 46 y 46b) ───────────────────────────
//
// QUÉ PASÓ. El bot de Meta Ads ("meta-externalads") recorre /autos con miles de
// combinaciones de filtros (?marca=&modelo=&precio_min=&precio_max=…). Cada
// combinación es una página dinámica sin caché: consulta `catalogo_publico` y,
// como además ejecuta el JS, dispara /api/track. Medido en los logs: +25.000
// consultas y ~4.000 inserts en `web_eventos` cada 15 minutos. Eso saturó el
// proyecto de Supabase que COMPARTE con el sistema de gestión — timeouts y el
// login de gestión sin cargar. O sea: un bot de publicidad dejando sin sistema
// a la agencia.
//
// QUÉ SE CORTA: sólo /autos CON query y /api/track. Con 403, seco, antes de
// tocar la base.
//
// QUÉ QUEDA ABIERTO, a propósito: la home, las fichas (/autos/:slug), /usados/*
// y /autos SIN query. Meta tiene que poder revisar las landings de los anuncios,
// y esas son páginas contadas, no un árbol infinito.
//
// Y LA EXCEPCIÓN: si la query trae `utm_` o `fbclid` es la URL de un anuncio
// REAL —la que el bot tiene que poder revisar—, no una combinación de filtros
// que se inventó él. Esa pasa.
//
// ESTA ES LA PUERTA PARA LOS QUE NO LEEN robots.txt. A los que sí lo leen
// —Google y Bing— los frena `Disallow: /autos?` (src/app/robots.ts), y los links
// de filtros van con rel="nofollow" para no invitar a nadie a entrar.
// A QUIÉN SE LE CIERRA. Meta Ads fue el que tiró la base, pero el problema es
// de cualquiera que recorra combinaciones de filtros, así que la regla vale para
// todos (tanda 46b): los genéricos («bot», «crawler», «spider») más los que se
// vieron o se esperan por nombre.
const BOTS = [
  "meta-externalads",
  "facebookexternalhit",
  "bot",
  "crawler",
  "spider",
  "bytespider",
  "ahrefs",
  "semrush",
  "gptbot",
  "claudebot",
  "amazonbot",
];

// GOOGLE Y BING NO SE BLOQUEAN ACÁ. Los dos respetan robots.txt, y ahí ya está
// el `Disallow: /autos?`: frenarlos con un 403 sería pegarle a los únicos dos
// crawlers que nos interesa tener contentos —de ellos viene el tráfico— y un
// 403 repetido es una señal fea para el ranking. Van primero porque sus UA
// contienen «bot» y caerían en la lista de arriba.
const BOTS_PERMITIDOS = ["googlebot", "bingbot"];

/** Parámetros que delatan un anuncio real y no una combinación inventada. */
const QUERY_DE_ANUNCIO = ["utm_", "fbclid"];

function bloquearCrawler(request: NextRequest): Response | null {
  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
  if (BOTS_PERMITIDOS.some((b) => ua.includes(b))) return null;
  if (!BOTS.some((b) => ua.includes(b))) return null;

  const { pathname, search } = request.nextUrl;
  if (pathname === "/api/track") return new Response(null, { status: 403 });
  if (pathname === "/autos" && search.length > 1) {
    const q = search.toLowerCase();
    if (QUERY_DE_ANUNCIO.some((p) => q.includes(p))) return null;
    return new Response(null, { status: 403 });
  }
  return null;
}

// ─── Proxy ─────────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  // 0. Los crawlers, afuera antes que nada (tandas 46 y 46b).
  const bloqueo = bloquearCrawler(request);
  if (bloqueo) return bloqueo;

  // 1. *.vercel.app de producción -> tituscars.com
  const host = (request.headers.get("host") ?? "").toLowerCase();
  if (host.endsWith(".vercel.app") && process.env.VERCEL_ENV === "production") {
    return NextResponse.redirect(
      `${DOMINIO}${request.nextUrl.pathname}${request.nextUrl.search}`,
      308
    );
  }

  // 1b. Modo equipo (lib/equipo.ts): ?equipo=1 marca este dispositivo por un
  // año, ?equipo=0 la saca. Vuelve a la misma URL sin el parámetro (307: es
  // un paso técnico, no una URL que tenga que indexarse). La cookie se puede
  // leer desde el navegador para no cargar el Pixel ni mandar eventos.
  // ?equipo=1&v=luca guarda también el vendedor ("1.luca", ver lib/equipo.ts).
  const equipo = request.nextUrl.searchParams.get("equipo");
  if (equipo === "1" || equipo === "0") {
    const limpia = new URL(request.url);
    limpia.searchParams.delete("equipo");
    const vendedor = limpia.searchParams.get("v");
    limpia.searchParams.delete("v");
    const respuesta = NextResponse.redirect(limpia, 307);
    respuesta.cookies.set(COOKIE_EQUIPO, equipo === "1" ? valorEquipo(vendedor) : "0", {
      // "0" vive un rato: le avisa al navegador que borre el respaldo de localStorage.
      maxAge: equipo === "1" ? UN_ANIO_S : 300,
      path: "/",
      sameSite: "lax",
      secure: true,
      httpOnly: false,
    });
    respuesta.headers.set("Cache-Control", "no-store");
    return respuesta;
  }

  let pathname = request.nextUrl.pathname;

  // 2. Barra final (menos la raíz)
  if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.replace(/\/+$/, "") || "/";

  // 3. Prefijo de idioma de Tienda Nube
  pathname = pathname.replace(IDIOMA, "") || "/";

  // 3b. /usados/Toyota -> /usados/toyota (las páginas para Google van en minúscula).
  if (pathname.startsWith("/usados/")) pathname = pathname.toLowerCase();

  // 4. URLs viejas
  const vieja = redireccion(request, pathname);
  if (vieja) return vieja;

  // 5. Cualquier otra ruta que no es de esta web (URLs viejas de Tienda Nube
  // que no están en la lista): 308 al catálogo, nunca 404. Va antes de
  // limpiar la barra para que /blog/ resuelva en un solo salto.
  if (!esRutaPropia(pathname)) return NextResponse.redirect(urlDestino(request, "/autos"), 308);

  // 6. Sólo cambió la barra o el prefijo: a la ruta limpia, con su query
  if (pathname !== request.nextUrl.pathname) {
    return NextResponse.redirect(urlDestino(request, pathname, request.nextUrl.search), 308);
  }

  // 7. Fichas
  const ficha = pathname.match(/^\/autos\/([^/]+)$/);
  if (ficha) return resolverFicha(request, decodeURIComponent(ficha[1]));

  return NextResponse.next();
}

export const config = {
  // Todo menos los assets de Next (JS/CSS con hash e imágenes optimizadas).
  matcher: ["/((?!_next/static|_next/image).*)"],
};
