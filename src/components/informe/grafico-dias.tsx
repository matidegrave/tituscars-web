"use client";

import { useEffect, useRef, useState } from "react";
import type { DiaInforme } from "@/lib/informe";
import s from "./informe.module.css";

/**
 * Gráfico "Día por día" del informe. En compu, el hover de siempre (tooltip
 * por CSS, sólo con mouse). En el celu se arrastra: el ancho del gráfico se
 * divide en bandas invisibles, una por día; el dedo elige la banda (aunque
 * esté sobre el espacio vacío arriba de la barra), una línea guía lo sigue y
 * el valor va en un renglón fijo ARRIBA del gráfico, nunca bajo el dedo. Al
 * soltar queda el último día tocado.
 *
 * Gestos: touch-action pan-y en el contenedor (el scroll vertical sigue siendo
 * de la página). El primer touchmove sólo mira la dirección; recién cuando el
 * gesto es horizontal se hace preventDefault y se sigue el dedo. Si es
 * vertical, el gráfico lo suelta y la página scrollea.
 *
 * REGLA: el gráfico puede mostrar un parcial por día, NUNCA un subtotal del
 * período. Los totales van sólo donde está el total completo (las fichas de
 * arriba, ML + WhatsApp); un agregado del gráfico (que sólo desglosa WhatsApp
 * del catálogo) compite con ellas y el cliente no sabe cuál creer. Por eso sin
 * día elegido el renglón muestra las visitas de la ficha (visitasTotal), no
 * una suma de la serie.
 *
 * Las barras NO suman el total del período, y eso es correcto: Mercado Libre
 * informa con demora (ml_hasta), así que los últimos días sólo tienen el
 * catálogo. El total sale de la ficha, nunca de sumar las barras. Si alguna
 * vez parecen no coincidir, la respuesta es la nota de abajo del gráfico
 * ("Mercado Libre informa las visitas con unos días de demora…"), no cambiar
 * el número.
 */

const UMBRAL_PX = 8;

const ddmm = (f: string) => `${f.slice(8, 10)}/${f.slice(5, 7)}`;
const visitas = (n: number) => `${n} ${n === 1 ? "visita" : "visitas"}`;
const consultas = (n: number) => `${n} ${n === 1 ? "consulta" : "consultas"} por WhatsApp`;

export function GraficoDias({ serie, visitasTotal }: { serie: DiaInforme[]; visitasTotal: number }) {
  const zona = useRef<HTMLDivElement>(null);
  const [elegido, setElegido] = useState<number | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  useEffect(() => {
    const el = zona.current;
    if (!el) return;
    let inicio: { x: number; y: number } | null = null;
    let direccion: "h" | "v" | null = null;

    const diaEn = (x: number) => {
      const r = el.getBoundingClientRect();
      const i = Math.floor(((x - r.left) / r.width) * serie.length);
      return Math.min(serie.length - 1, Math.max(0, i));
    };

    const alTocar = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      inicio = { x: t.clientX, y: t.clientY };
      direccion = null;
      setElegido(diaEn(t.clientX));
      setArrastrando(true);
    };

    const alMover = (e: TouchEvent) => {
      if (!inicio || e.touches.length !== 1) return;
      const t = e.touches[0];
      if (direccion === null) {
        const dx = Math.abs(t.clientX - inicio.x);
        const dy = Math.abs(t.clientY - inicio.y);
        if (dx < UMBRAL_PX && dy < UMBRAL_PX) return;
        direccion = dx > dy ? "h" : "v";
        if (direccion === "v") {
          // Scroll de la página: el gráfico no se mete.
          setArrastrando(false);
          return;
        }
      }
      if (direccion !== "h") return;
      if (e.cancelable) e.preventDefault();
      setElegido(diaEn(t.clientX));
    };

    const alSoltar = () => {
      inicio = null;
      direccion = null;
      setArrastrando(false);
    };

    el.addEventListener("touchstart", alTocar, { passive: true });
    el.addEventListener("touchmove", alMover, { passive: false });
    el.addEventListener("touchend", alSoltar);
    el.addEventListener("touchcancel", alSoltar);
    return () => {
      el.removeEventListener("touchstart", alTocar);
      el.removeEventListener("touchmove", alMover);
      el.removeEventListener("touchend", alSoltar);
      el.removeEventListener("touchcancel", alSoltar);
    };
  }, [serie.length]);

  const max = Math.max(1, ...serie.map((x) => x.visitas));
  const paso = Math.max(1, Math.ceil(serie.length / 8));
  const dia = elegido !== null ? serie[elegido] : null;

  return (
    <>
      {/* Siempre ocupa su lugar (con el total si no hay día elegido): el gráfico no salta. */}
      <div className={s.lectura} aria-live="polite" data-testid="lectura-dia">
        {dia ? (
          <span>
            <b>{ddmm(dia.fecha)}</b> — {visitas(dia.visitas)}
            {dia.consultas > 0 && ` · ${consultas(dia.consultas)}`}
          </span>
        ) : (
          <span>
            En el período: <b>{visitas(visitasTotal)}</b>
          </span>
        )}
      </div>
      <div ref={zona} className={s.zonaTactil} data-testid="grafico-dias">
        <div className={s.bars} role="img" aria-label="Visitas por día del período">
          {serie.map((x, i) => {
            const alto = (x.visitas / max) * 100;
            return (
              <div key={x.fecha} className={`${s.bcol} ${i === elegido ? s.elegido : ""}`}>
                {x.visitas > 0 && <div className={s.bar} style={{ height: `${alto}%` }} />}
                {x.consultas > 0 && <span className={s.dot} style={{ bottom: `calc(${alto}% + 6px)` }} />}
                <span className={s.tip}>
                  {ddmm(x.fecha)} — {visitas(x.visitas)}
                  {x.consultas > 0 && ` · ${x.consultas} ${x.consultas === 1 ? "consulta" : "consultas"}`}
                </span>
              </div>
            );
          })}
          {arrastrando && elegido !== null && (
            <span
              className={s.guia}
              style={{ left: `${((elegido + 0.5) / serie.length) * 100}%` }}
              aria-hidden="true"
            />
          )}
        </div>
        <div className={s.xax} aria-hidden="true">
          {serie.map((x, i) => (
            <span key={x.fecha}>{i % paso === 0 ? x.fecha.slice(8, 10) : ""}</span>
          ))}
        </div>
      </div>
    </>
  );
}
