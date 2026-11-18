import type { Moneda } from "@/lib/types";

const numeroAR = new Intl.NumberFormat("es-AR");

export function formatPrecio(precio: number, moneda: Moneda): string {
  if (moneda === "USD") {
    return `USD ${numeroAR.format(precio)}`;
  }
  return `$ ${numeroAR.format(precio)}`;
}

/**
 * Baja de precio para mostrar, o null si no hay (o si los datos no cierran:
 * nunca se muestra una suba). diferencia va en la moneda del auto.
 */
export function bajaDePrecio(auto: {
  precio: number;
  precio_anterior: number | null;
  moneda: Moneda;
}): { anterior: string; diferencia: string } | null {
  const anterior = auto.precio_anterior;
  if (anterior === null || anterior === undefined || !(anterior > auto.precio)) return null;
  return {
    anterior: formatPrecio(anterior, auto.moneda),
    diferencia: formatPrecio(anterior - auto.precio, auto.moneda),
  };
}

/** % de baja (0–1) en pesos, para ordenar. 0 si no hay baja. */
export function porcentajeBaja(auto: { precio_ars: number; precio_anterior_ars: number | null }): number {
  const ant = auto.precio_anterior_ars;
  return ant && ant > auto.precio_ars ? (ant - auto.precio_ars) / ant : 0;
}

/**
 * Km para mostrar (solo visual; filtros y orden usan el valor real): menos de
 * 1000 va exacto, desde 1000 se redondea a miles (120.933 → "121.000 km").
 * Sin km no se muestra nada.
 */
export function formatKm(km: number | null | undefined): string | null {
  if (km === null || km === undefined) return null;
  const redondeado = km < 1000 ? km : Math.round(km / 1000) * 1000;
  return `${numeroAR.format(redondeado)} km`;
}

export function formatMiles(valor: number | string): string {
  const digitos = String(valor).replace(/\D/g, "");
  if (!digitos) return "";
  return numeroAR.format(Number(digitos));
}

export function parseMiles(texto: string): number | undefined {
  const digitos = texto.replace(/\D/g, "");
  return digitos ? Number(digitos) : undefined;
}

export function tituloAuto(a: {
  marca: string;
  modelo: string;
  version?: string | null;
}): string {
  return [a.marca, a.modelo, a.version].filter(Boolean).join(" ").toUpperCase();
}

/** Es una moto (carroceria = 'moto'): card, ficha y WhatsApp cambian (WEB-MOTOS1). */
export function esMoto(a: { carroceria: string | null }): boolean {
  return a.carroceria === "moto";
}

/** "400 cc", o null sin cilindrada. */
export function formatCc(cc: number | null | undefined): string | null {
  return cc ? `${numeroAR.format(cc)} cc` : null;
}

/**
 * Datos de un vistazo (card y ficha), sin el año: auto "45.000 km · Nafta ·
 * Automática"; moto "6.000 km · 400 cc" (sin combustible ni transmisión).
 */
export function datosVehiculo(a: {
  km: number | null;
  combustible: string | null;
  transmision: string | null;
  carroceria: string | null;
  cilindrada?: number | null;
}): string[] {
  if (esMoto(a)) return [formatKm(a.km), formatCc(a.cilindrada)].filter((x): x is string => Boolean(x));
  return [
    formatKm(a.km),
    a.combustible,
    a.transmision === "manual" ? "Manual" : a.transmision === "automatica" ? "Automática" : null,
  ].filter((x): x is string => Boolean(x));
}
