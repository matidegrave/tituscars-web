// Datos estructurados (schema.org / JSON-LD) para resultados enriquecidos en
// Google. Se renderizan en el servidor con <JsonLd>.

import { parsePublicacion } from "@/lib/descripcion";
import { tituloAuto } from "@/lib/format";
import {
  DIRECCION_CALLE,
  DIRECCION_LOCALIDAD,
  GOOGLE_PUNTAJE,
  HORARIOS_SCHEMA,
  INSTAGRAM_URL,
  RESENAS_CANTIDAD,
  RESENAS_URL,
  SITE_URL,
  TIKTOK_URL,
  YOUTUBE_URL,
} from "@/lib/config";
import type { AutoCatalogo } from "@/lib/types";

type JsonLdObjeto = Record<string, unknown>;

const NOMBRE = "Titus Cars";
const TELEFONO = "+5493513283316";
const CODIGO_POSTAL = "5009";

const vendedor = { "@type": "AutoDealer", name: NOMBRE, url: SITE_URL };

const absoluta = (url: string) => (url.startsWith("http") ? url : `${SITE_URL}${url}`);

/** Descripción del auto para buscadores: los items de la publicación (sin encabezado ni cierre). */
function descripcionAuto(auto: AutoCatalogo): string | undefined {
  const { items } = parsePublicacion(auto.publicacion_texto);
  const lista = items.length > 0 ? items : (auto.descripcion_items ?? []).map((i) => i.texto);
  return lista.length > 0 ? lista.join(", ") : undefined;
}

/** schema.org Car (subtipo de Product) para la ficha. */
export function jsonLdAuto(auto: AutoCatalogo): JsonLdObjeto {
  const url = `${SITE_URL}/autos/${auto.slug}`;
  const condicion =
    auto.condicion === "0km" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition";
  const fotos = (auto.fotos ?? []).map((f) => absoluta(f.url));
  const imagenes = fotos.length > 0 ? fotos : auto.foto_principal ? [absoluta(auto.foto_principal)] : [];

  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${tituloAuto(auto)} ${auto.anio}`,
    brand: { "@type": "Brand", name: auto.marca },
    model: auto.modelo,
    vehicleModelDate: String(auto.anio),
    // km real: el redondeo de la web es sólo visual.
    ...(auto.km !== null && {
      mileageFromOdometer: { "@type": "QuantitativeValue", value: auto.km, unitCode: "KMT" },
    }),
    ...(auto.combustible && { fuelType: auto.combustible }),
    ...(auto.transmision && {
      vehicleTransmission: auto.transmision === "manual" ? "Manual" : "Automática",
    }),
    ...(auto.carroceria && {
      bodyType: auto.carroceria.charAt(0).toUpperCase() + auto.carroceria.slice(1),
    }),
    itemCondition: condicion,
    ...(imagenes.length > 0 && { image: imagenes }),
    url,
    ...(descripcionAuto(auto) && { description: descripcionAuto(auto) }),
    // Sin precio no hay oferta.
    ...(auto.precio_ars > 0 && {
      offers: {
        "@type": "Offer",
        price: auto.precio_ars,
        priceCurrency: "ARS",
        availability: "https://schema.org/InStock",
        url,
        itemCondition: condicion,
        seller: vendedor,
      },
    }),
  };
}

/** schema.org AutoDealer para la home. */
export function jsonLdConcesionaria(): JsonLdObjeto {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: NOMBRE,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-horizontal@2x.png`,
    image: `${SITE_URL}/brand/local-frente.webp`,
    telephone: TELEFONO,
    address: {
      "@type": "PostalAddress",
      streetAddress: DIRECCION_CALLE,
      addressLocality: DIRECCION_LOCALIDAD,
      addressRegion: "Córdoba",
      postalCode: CODIGO_POSTAL,
      addressCountry: "AR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Number(GOOGLE_PUNTAJE.replace(",", ".")),
      reviewCount: RESENAS_CANTIDAD,
    },
    openingHoursSpecification: HORARIOS_SCHEMA.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    })),
    sameAs: [INSTAGRAM_URL, TIKTOK_URL, YOUTUBE_URL, RESENAS_URL],
  };
}

/** schema.org ItemList para /autos: los autos que se muestran, en orden. */
export function jsonLdListaAutos(autos: AutoCatalogo[]): JsonLdObjeto {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: autos.slice(0, 24).map((auto, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/autos/${auto.slug}`,
    })),
  };
}
