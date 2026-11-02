import { WHATSAPP_CONSIGNAS } from "@/lib/config";
import { linkWhatsapp } from "@/lib/whatsapp";
import type { DatosInforme, Informe } from "@/lib/informe";
import { GraficoDias } from "./grafico-dias";
import s from "./informe.module.css";

/**
 * El informe tal como lo ve el consignante: el ÚNICO lugar donde se dibuja un
 * informe. Lo usan la página pública (/informe/[token], datos de la base) y la
 * vista previa del panel de revisión de gestión (/informe/preview, datos por
 * postMessage). No sabe en cuál está: sin flag de preview ni un if por ruta.
 * Sin hooks ni APIs del servidor, así sirve en los dos lados; el gráfico día
 * por día es el único componente de cliente (arrastre con el dedo).
 */

const MENSAJE_INFORME = "Hola! Te escribo por el informe de publicación de mi auto.";
export const LINK_WHATSAPP_INFORME = linkWhatsapp(WHATSAPP_CONSIGNAS, MENSAJE_INFORME);

const entero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/** "2026-09-17" -> "17/09" (sin Date: las fechas ya vienen en hora de Córdoba). */
const ddmm = (f: string) => `${f.slice(8, 10)}/${f.slice(5, 7)}`;
const ddmmaaaa = (f: string) => `${ddmm(f)}/${f.slice(0, 4)}`;
/** El período, igual en el encabezado y en el título de los números. */
const rangoPeriodo = (d: DatosInforme) => `${ddmm(d.periodo.desde)} – ${ddmmaaaa(d.periodo.hasta)}`;

function precio(valor: number, moneda: "ARS" | "USD"): string {
  return `${moneda === "USD" ? "US$ " : "$"}${entero.format(valor)}`;
}

/** Días entre dos fechas AAAA-MM-DD (sin Date local: UTC puro). */
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
const FECHA_ISO = /^d{4}-d{2}-d{2}$/;

const POSICION: Record<string, string> = {
  "cuarto superior": "Está entre los que más se ven de su rango.",
  "entre la mediana y el cuarto superior": "Se ve más que el auto típico de su rango.",
  "entre el cuarto inferior y la mediana": "Se ve menos que el auto típico de su rango.",
  "debajo del cuarto inferior": "Está entre los que menos se ven de su rango.",
};

function Cabecera({ d }: { d: DatosInforme }) {
  const ultimoCambio = d.precio.cambios_periodo[d.precio.cambios_periodo.length - 1];
  // Informes nuevos: fecha del último cambio de precio (o del primero). Se cuenta hasta el día en que
  // se generó el informe, así el número no cambia según cuándo lo abra el dueño.
  const sinCambiosDias =
    d.precio.sin_cambios_desde && FECHA_ISO.test(d.precio.sin_cambios_desde)
      ? Math.max(0, diasEntre(d.precio.sin_cambios_desde, d.generado_el))
      : null;
  return (
    <div className={s.card}>
      <div className={s.hd}>
        <div>
          <div className={s.logo}>Titus Cars</div>
          <h1>{d.vehiculo}</h1>
          <div className={s.sub}>
            {[d.anio, d.km !== null ? `${entero.format(d.km)} km` : null, `Dominio ${d.dominio}`]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <div className={s.cyc}>
          {d.numero !== null ? `Informe N.º ${d.numero}` : "Informe a pedido"}
          <br />
          {rangoPeriodo(d)}
        </div>
      </div>
      <div className={s.meta}>
        {d.dias_publicado !== null && (
          <span>
            Publicado hace <b>{entero.format(d.dias_publicado)} días</b> en total
          </span>
        )}
        {d.precio.actual !== null && (
          <span>
            Precio actual <b>{precio(d.precio.actual, d.precio.moneda)}</b>
          </span>
        )}
        {sinCambiosDias !== null ? (
          <span>
            Precio sin cambios hace <b>{entero.format(sinCambiosDias)} {sinCambiosDias === 1 ? "día" : "días"}</b>
          </span>
        ) : ultimoCambio ? (
          <span>Precio actualizado el {ddmm(ultimoCambio.fecha)}</span>
        ) : (
          d.precio.sin_cambios_desde && !FECHA_ISO.test(d.precio.sin_cambios_desde) && (
            <span>Sin cambios de precio {d.precio.sin_cambios_desde}</span>
          )
        )}
      </div>
    </div>
  );
}

function Resumen({ texto }: { texto: string }) {
  return (
    <div className={s.card}>
      <div className={s.ia}>
        <div className={s.tag}>Lectura del período</div>
        {texto.split(/\n\s*\n/).map((p, i) => (
          <p key={i}>{p.trim()}</p>
        ))}
      </div>
    </div>
  );
}

function Numeros({ d }: { d: DatosInforme }) {
  const yt = d.youtube;
  return (
    <div className={s.card}>
      {/* Mismo rango que el encabezado, para que se lean como el mismo período. Los días son los
          PUBLICABLES, no la diferencia de fechas: con días fuera de publicación el calendario miente. */}
      <h2>
        Los números del período ({rangoPeriodo(d)}
        {d.periodo.dias_publicables !== null &&
          ` · ${entero.format(d.periodo.dias_publicables)} día${d.periodo.dias_publicables === 1 ? "" : "s"}`}
        )
      </h2>
      <div className={s.tiles}>
        <div className={s.tile}>
          <div className={s.v}>{entero.format(d.numeros.visitas_total)}</div>
          <div className={s.l}>Visitas al aviso</div>
          {/* Las visitas suman SÓLO Mercado Libre y tituscars.com (los únicos que las informan). Sin
              esto, al lado de «6 Portales» se leía como el total de los seis. */}
          <div className={s.d}>
            {d.portales.includes("Mercado Libre") ? "Mercado Libre y tituscars.com" : "en tituscars.com"}
          </div>
        </div>
        <div className={s.tile}>
          <div className={s.v}>{entero.format(d.numeros.consultas_total)}</div>
          <div className={s.l}>Consultas recibidas</div>
        </div>
        {yt && (
          <div className={s.tile}>
            <div className={s.v}>{entero.format(yt.views_periodo ?? yt.views_acumuladas)}</div>
            <div className={s.l}>Vistas del video</div>
            <div className={s.d}>{yt.views_periodo !== null ? "en el período" : "desde que se publicó"}</div>
          </div>
        )}
        <div className={s.tile}>
          <div className={s.v}>{d.portales.length}</div>
          <div className={s.l}>Portales donde está publicado</div>
        </div>
      </div>
      <ComoLeer d={d} />
    </div>
  );
}

/**
 * «Cómo leer estos números», pegado debajo de los casilleros: sin esto «248 Visitas» al lado de
 * «6 Portales» se lee como 248 repartidas en seis, y son dos canales (ML + catálogo). Antes era
 * una nota suelta y el ojo la salteaba. Nombra SÓLO los portales que están en d.portales: nunca
 * afirma que el auto está publicado donde el informe no lo lista.
 */
function ComoLeer({ d }: { d: DatosInforme }) {
  const conMl = d.portales.includes("Mercado Libre");
  const sin = SIN_ORIGEN.filter((p) => d.portales.includes(p));
  const fuentes = conMl
    ? "de Mercado Libre y de nuestro catálogo, que son los dos canales que informan estadísticas"
    : "de nuestro catálogo, que es el canal que informa estadísticas";
  const resto = sin.length
    ? ` ${enumerar(sin)} no las ${sin.length === 1 ? "publica" : "publican"}: tu auto está publicado ahí también, pero esas visitas no se pueden contar. En la realidad, el auto se vio más veces de las que figuran acá.`
    : "";
  return (
    <div className={s.comoLeer} data-testid="como-leer">
      <div className={s.comoLeerTit}>Cómo leer estos números</div>
      <p>
        Las visitas y consultas de arriba salen {fuentes}.{resto}
      </p>
      <p>
        Igual sirven, y mucho. Al medir siempre lo mismo, quincena a quincena, la relación entre visitas y consultas
        es la forma más clara de ver si el interés sube, se sostiene o cae.
      </p>
    </div>
  );
}

function DiaPorDia({ d }: { d: DatosInforme }) {
  if (d.serie.length === 0) return null;
  const mlAtrasado = d.ml_hasta !== null && d.ml_hasta < d.periodo.hasta;
  return (
    <div className={`${s.card} ${s.flush}`}>
      <h2>Día por día</h2>
      <GraficoDias serie={d.serie} visitasTotal={d.numeros.visitas_total} />
      <div className={s.legline}>
        <span className={s.swatch} /> Día con consulta por WhatsApp
      </div>
      {mlAtrasado && (
        <p className={s.sub} style={{ marginTop: 10 }}>
          Mercado Libre informa las visitas con unos días de demora: después del {ddmm(d.ml_hasta!)} el gráfico
          muestra sólo las de tituscars.com.
        </p>
      )}
      <details className={s.detalles}>
        <summary>Ver la tabla de datos</summary>
        <table className={s.tabla}>
          <thead>
            <tr>
              <th>Día</th>
              <th className={s.num}>Visitas</th>
              <th className={s.num}>Consultas</th>
            </tr>
          </thead>
          <tbody>
            {d.serie.map((x) => (
              <tr key={x.fecha}>
                <td>{ddmm(x.fecha)}</td>
                <td className={s.num}>{x.visitas}</td>
                <td className={s.num}>{x.consultas || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

// Portales que no informan estadísticas (ni visitas ni de dónde vienen). Los
// nombra «Cómo leer estos números», SÓLO si están en d.portales de este auto.
const SIN_ORIGEN = ["De Ruedas", "Clasificados La Voz", "Facebook Marketplace"];

function enumerar(nombres: string[]): string {
  return nombres.length < 2 ? nombres.join("") : `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

function Origen({ d }: { d: DatosInforme }) {
  if (d.origen.length === 0) return null;
  const max = Math.max(...d.origen.map((o) => o.visitas));
  return (
    <div className={s.card}>
      <h2>De dónde vinieron las visitas</h2>
      <div className={s.rank}>
        {d.origen.map((o) => (
          <div key={o.fuente} className={s.row}>
            <span className={s.k}>{o.fuente}</span>
            <div>
              <div className={s.rbar} style={{ width: `${(o.visitas / max) * 100}%` }} />
            </div>
            <span className={s.n}>{entero.format(o.visitas)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Posicion({ d }: { d: DatosInforme }) {
  if (d.stock) {
    const { n, puesto, visitas_tipicas } = d.stock;
    return (
      <div className={s.card}>
        <h2>Dónde está parado</h2>
        <p className={s.sub}>
          De los <b>{entero.format(n)} autos</b> que tenemos publicados, el tuyo fue el <b>puesto {entero.format(puesto)}</b>{" "}
          en visitas en estos 15 días. Un auto típico del stock tuvo <b>{entero.format(visitas_tipicas)} visitas</b>.
        </p>
      </div>
    );
  }
  // Informes viejos (sin d.stock): se siguen viendo como se generaron.
  const seg = d.segmento;
  if (!seg) return null;
  const visitas = d.numeros.visitas_total;
  const tope = Math.max(seg.p75 * 1.3, visitas * 1.1, 1);
  const pct = (v: number) => Math.min(97, Math.max(3, (v / tope) * 100));
  const tu = pct(visitas);
  return (
    <div className={s.card}>
      <h2>Dónde está parado</h2>
      <p className={s.sub}>
        Comparado con los <b>{seg.n} vehículos</b> de nuestra cartera en el rango {seg.banda}, por visitas en el
        período:
      </p>
      <div className={s.strip} aria-hidden="true">
        <div className={s.track} />
        {[seg.p25, seg.mediana, seg.p75].map((v, i) => (
          <div key={i} className={s.mk} style={{ left: `${pct(v)}%` }}>
            <b>{entero.format(v)}</b>
          </div>
        ))}
        <div className={s.you} style={{ left: `${tu}%` }}>
          <span className={`${s.lb} ${tu > 60 ? s.lbDer : s.lbIzq}`}>Tu auto · {entero.format(visitas)}</span>
          <span className={s.pin} />
        </div>
      </div>
      <p className={s.sub} style={{ marginTop: 18 }}>
        {POSICION[seg.posicion] && (
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>{POSICION[seg.posicion]} </span>
        )}
        Las tres marcas son las visitas del cuarto de autos que menos se ve, del auto típico y del cuarto que más se
        ve.
      </p>
    </div>
  );
}

function Portales({ d }: { d: DatosInforme }) {
  if (d.portales.length === 0) return null;
  return (
    <div className={s.card}>
      <h2>Dónde está publicado hoy</h2>
      <div className={s.ports}>
        {d.portales.map((p) => (
          <div key={p} className={s.port}>
            <span className={s.chk} aria-hidden="true">
              ✓
            </span>
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}

export function InformeVista({ datos: d, resumen }: Informe) {
  return (
    <div className={s.pagina}>
      <div className={s.wrap}>
        <Cabecera d={d} />
        {resumen && <Resumen texto={resumen} />}
        <Numeros d={d} />
        <DiaPorDia d={d} />
        <Origen d={d} />
        <Posicion d={d} />
        <Portales d={d} />
        <div className={s.ft}>
          Titus Cars · Informe generado el {ddmmaaaa(d.generado_el)}
          <br />
          Cualquier duda sobre este informe,{" "}
          <a href={LINK_WHATSAPP_INFORME} target="_blank" rel="noopener noreferrer">
            escribinos
          </a>
          .
        </div>
      </div>
    </div>
  );
}

/** Vencido, no encontrado (y el error de la vista previa): texto + WhatsApp, sin ningún dato. */
export function AvisoInforme({ texto, conWhatsapp = true }: { texto: string; conWhatsapp?: boolean }) {
  return (
    <div className={s.pagina}>
      <div className={s.wrap}>
        <div className={`${s.card} ${s.aviso}`}>
          <div className={s.logo}>Titus Cars</div>
          <p>{texto}</p>
          {conWhatsapp && (
            <a className={s.boton} href={LINK_WHATSAPP_INFORME} target="_blank" rel="noopener noreferrer">
              Escribinos por WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
