"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { WHATSAPP_VENTAS, telefonoLegible } from "@/lib/config";
import { esEquipoCliente } from "@/lib/equipo";
import { COOKIE_ANUNCIO, COOKIE_ORIGEN } from "@/lib/origen";
import {
  esIdAnuncio,
  linkVenta,
  numeroVentas,
  refAnuncio,
  type CodigosAnuncio,
  type Venta,
} from "@/lib/whatsapp";

/**
 * El WhatsApp de venta de esta visita para los componentes de cliente
 * (header, menú, flotante, footer, ficha, formularios): número de pauta o
 * portales (tanda 51) y ref del anuncio para el mensaje (tanda 52).
 *
 * Se resuelve EN EL NAVEGADOR con las cookies tc_origen / tc_anuncio (las pone
 * el proxy, legibles desde JS): así las páginas son estáticas y se sirven del
 * caché de Vercel en vez de renderizarse en cada visita (tanda de consumo,
 * oct-2026). El HTML sale con el de portales y, si la visita vino por un
 * anuncio, cambia al hidratar. El código del anuncio (ID de Meta -> "W1") sale
 * de /api/anuncios-ref, estática (se pide sólo si el anuncio es un ID).
 */
const VENTA_PORTALES: Venta = { numero: WHATSAPP_VENTAS, ref: null };
const VentaVisita = createContext<Venta>(VENTA_PORTALES);

function leerCookie(nombre: string): string | undefined {
  const valor = document.cookie.match(new RegExp(`(?:^|;\\s*)${nombre}=([^;]*)`))?.[1];
  if (valor === undefined) return undefined;
  try {
    return decodeURIComponent(valor);
  } catch {
    return valor;
  }
}

async function codigosAnuncios(): Promise<CodigosAnuncio | undefined> {
  try {
    const res = await fetch("/api/anuncios-ref");
    return res.ok ? ((await res.json()) as CodigosAnuncio) : undefined;
  } catch {
    return undefined;
  }
}

const sinSuscripcion = () => () => {};

export function LineaWhatsapp({ children }: { children: React.ReactNode }) {
  // false en el servidor y al hidratar (mismo HTML que el estático); true después.
  const enNavegador = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const numero = enNavegador ? numeroVentas(leerCookie(COOKIE_ORIGEN)) : VENTA_PORTALES.numero;
  const anuncio = enNavegador && !esEquipoCliente() ? leerCookie(COOKIE_ANUNCIO) : undefined;
  const conId = esIdAnuncio(anuncio);

  // Sin la tabla la ref es "A750443"; cuando llega, el código ("W1").
  const [codigos, setCodigos] = useState<CodigosAnuncio>();
  useEffect(() => {
    if (!conId) return;
    let vigente = true;
    void codigosAnuncios().then((c) => {
      if (vigente && c) setCodigos(c);
    });
    return () => {
      vigente = false;
    };
  }, [conId]);

  const venta = useMemo<Venta>(
    () => ({ numero, ref: refAnuncio(anuncio, codigos) }),
    [numero, anuncio, codigos]
  );
  return <VentaVisita.Provider value={venta}>{children}</VentaVisita.Provider>;
}

export function useVenta(): Venta {
  return useContext(VentaVisita);
}

/** <a> al WhatsApp de venta de esta visita, para usar desde páginas del servidor. */
export function LinkVenta({
  mensaje,
  ...props
}: { mensaje?: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return <a href={linkVenta(useVenta(), mensaje)} {...props} />;
}

/** El número de venta de esta visita, legible ("351 530-3712"). */
export function NumeroVenta() {
  return <>{telefonoLegible(useVenta().numero)}</>;
}
