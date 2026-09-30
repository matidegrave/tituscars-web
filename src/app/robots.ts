import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

/**
 * LOS FILTROS NO SE RASTREAN (tanda 46b). /autos con query es un arbol
 * infinito: cada combinacion de marca + modelo + precio + combustible es una
 * URL distinta, dinamica y sin cache, que consulta `catalogo_publico`. El
 * crawler de Meta Ads recorrio miles y saturo el Supabase que la web comparte
 * con el sistema de gestion (ver tanda 46).
 *
 * `Disallow: /autos?` corta eso para TODO crawler que respete robots.txt
 * —Google y Bing incluidos, que es como se los frena a ellos— y deja pasando
 * lo que sirve de verdad: /autos sin query, las fichas (/autos/:slug) y las
 * paginas /usados/*, que son contadas y son las que tienen que indexarse.
 *
 * A los que NO respetan robots.txt los corta el proxy por user-agent.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/autos?",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
