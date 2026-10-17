"use client";

import { useEffect, useState } from "react";
import type { Informe } from "@/lib/informe";
import {
  origenesErp,
  SIN_DATOS,
  TIPO_ERROR,
  TIPO_LISTA,
  TIPO_RENDERIZADO,
  validarDatos,
  VERSION,
} from "@/lib/informe-preview";
import { InformeVista } from "./informe-vista";
import s from "./informe.module.css";

/**
 * El lado web del contrato de la vista previa (lib/informe-preview.ts):
 * avisa `lista` al montar, valida cada `datos` del ERP y contesta
 * `renderizado` o `error`. Cada `datos` válido reemplaza al anterior. Nunca
 * queda en blanco: cualquier cosa fuera del contrato es un recuadro rojo con
 * el motivo, que además va al ERP y a la consola.
 */

const ORIGENES = origenesErp(process.env.NODE_ENV === "development");
const ESPERA_MS = 10_000;
// `lista` va una sola vez por carga (en `next dev` React monta los efectos dos veces).
let listaEnviada = false;

type Estado = { tipo: "esperando" } | { tipo: "ok"; informe: Informe } | { tipo: "error"; motivo: string };

/** A cada origen del ERP: el navegador entrega sólo al que coincide. Nunca '*'. */
function alErp(msg: Record<string, unknown>, origen?: string) {
  if (window.parent === window) return;
  for (const o of origen ? [origen] : ORIGENES) window.parent.postMessage(msg, o);
}

export function VistaPrevia() {
  const [estado, setEstado] = useState<Estado>({ tipo: "esperando" });

  useEffect(() => {
    // Ya hubo un datos válido o un error con motivo propio: la espera no lo pisa.
    let resuelto = false;

    const fallar = (motivo: string, origen?: string) => {
      resuelto = true;
      console.error(`[VISTA PREVIA] ${motivo}`);
      setEstado({ tipo: "error", motivo });
      alErp({ tipo: TIPO_ERROR, version: VERSION, motivo }, origen);
    };

    const alMensaje = (e: MessageEvent) => {
      // 1. Extensiones o scripts de la página: no son del contrato.
      if (e.source !== window.parent || window.parent === window) return;
      // 2. Origen fuera de la lista. No se le contesta a ese origen.
      if (!ORIGENES.includes(e.origin)) return fallar(`origen no permitido: ${e.origin}`);
      // 3 a 7.
      const r = validarDatos(e.data);
      if ("error" in r) return fallar(r.error, e.origin);
      // 8.
      resuelto = true;
      setEstado({ tipo: "ok", informe: r.informe });
      alErp({ tipo: TIPO_RENDERIZADO, version: VERSION }, e.origin);
    };

    window.addEventListener("message", alMensaje);
    if (!listaEnviada) {
      listaEnviada = true;
      alErp({ tipo: TIPO_LISTA, version: VERSION });
    }
    const espera = window.setTimeout(() => {
      if (!resuelto) fallar(SIN_DATOS);
    }, ESPERA_MS);

    return () => {
      window.removeEventListener("message", alMensaje);
      window.clearTimeout(espera);
    };
  }, []);

  if (estado.tipo === "ok") return <InformeVista datos={estado.informe.datos} resumen={estado.informe.resumen} />;
  return (
    <div className={s.pagina}>
      <div className={s.wrap}>
        {estado.tipo === "error" ? (
          <div className={s.errorPreview} role="alert" data-testid="preview-error">
            <b>Vista previa no disponible</b>
            <p>{estado.motivo}</p>
          </div>
        ) : (
          <p className={s.sub} data-testid="preview-esperando">
            Esperando los datos del informe…
          </p>
        )}
      </div>
    </div>
  );
}
