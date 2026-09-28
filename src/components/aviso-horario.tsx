"use client";

import { useEffect, useState } from "react";
import { HORARIOS_SCHEMA } from "@/lib/config";
import { cn } from "@/lib/utils";

const DIAS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const NOMBRE_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const aMinutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const hora = (hhmm: string) => String(Number(hhmm.slice(0, 2)));

/** Día (0 = domingo) y minuto del día en Córdoba, sea cual sea la zona del celu. */
function ahoraEnCordoba(): { dia: number; minuto: number } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Cordoba",
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return { dia: DIAS.indexOf(valor("weekday")), minuto: Number(valor("hour")) * 60 + Number(valor("minute")) };
}

const bloquesDe = (dia: number) =>
  HORARIOS_SCHEMA.filter((h) => h.dayOfWeek.includes(DIAS[dia])).sort((a, b) => a.opens.localeCompare(b.opens));

/**
 * "hoy a las 15" / "mañana desde las 9" / "el lunes desde las 9", o null si
 * ahora está abierto. Sale de HORARIOS_SCHEMA (lib/config.ts).
 */
export function cuandoRespondemos(ahora = ahoraEnCordoba()): string | null {
  const hoy = bloquesDe(ahora.dia);
  if (hoy.some((b) => aMinutos(b.opens) <= ahora.minuto && ahora.minuto < aMinutos(b.closes))) return null;
  const masTarde = hoy.find((b) => aMinutos(b.opens) > ahora.minuto);
  if (masTarde) return `hoy a las ${hora(masTarde.opens)}`;
  for (let i = 1; i <= 7; i++) {
    const dia = (ahora.dia + i) % 7;
    const primero = bloquesDe(dia)[0];
    if (!primero) continue;
    return i === 1
      ? `mañana desde las ${hora(primero.opens)}`
      : `el ${NOMBRE_DIA[dia]} desde las ${hora(primero.opens)}`;
  }
  return null;
}

/**
 * Aviso fuera de horario debajo de los botones de WhatsApp (ficha y /links).
 * Se calcula en el navegador (nunca queda cacheado con la hora del servidor);
 * en horario no muestra nada.
 */
export function AvisoHorario({ className }: { className?: string }) {
  const [cuando, setCuando] = useState<string | null>(null);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCuando(cuandoRespondemos());
    } catch {
      // sin Intl con zonas horarias: no se muestra
    }
  }, []);
  if (!cuando) return null;
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      Estamos fuera de horario. Escribinos igual: te respondemos {cuando}.
    </p>
  );
}
