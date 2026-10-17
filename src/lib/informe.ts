/**
 * Informe de publicación al consignante (Bloque 3 de gestión). La página
 * pública es /informe/[token]: los datos salen de informe_publico(p_token)
 * (anon, SECURITY DEFINER), que ya devuelve `datos` sin `datos.interno` y sólo
 * informes enviados o vencidos. Contrato y reglas:
 * docs/informe-tanda-pagina-publica.md del repo de gestión.
 *
 * El snapshot (`datos`) lo arma el generador de gestión
 * (supabase/functions/_shared/informe.ts, version 1). Acá se lee con lo
 * mínimo que la página necesita y se descarta lo que no tenga la forma
 * esperada: nunca se renderiza un campo que no esté en este tipo.
 */

/** Token de la URL: hex de 36. Si no matchea, no se consulta la base. */
export const TOKEN_INFORME = /^[0-9a-f]{36}$/;

export interface DiaInforme {
  fecha: string; // AAAA-MM-DD
  visitas: number; // catálogo + Mercado Libre (null de ML cuenta 0)
  consultas: number; // WhatsApp del catálogo
}

export interface DatosInforme {
  generado_el: string;
  vehiculo: string;
  anio: number | null;
  km: number | null;
  dominio: string;
  tipo: "programado" | "a_pedido";
  numero: number | null;
  periodo: { desde: string; hasta: string };
  dias_publicado: number | null;
  precio: {
    actual: number | null;
    moneda: "ARS" | "USD";
    cambios_periodo: { fecha: string; precio_anterior: number; precio_nuevo: number }[];
    sin_cambios_desde: string | null;
  };
  numeros: { visitas_total: number; consultas_total: number; conversion: number | null };
  ml_hasta: string | null;
  serie: DiaInforme[];
  origen: { fuente: string; visitas: number }[];
  segmento: { banda: string; n: number; p25: number; mediana: number; p75: number; posicion: string } | null;
  youtube: { views_acumuladas: number; views_periodo: number | null } | null;
  portales: string[];
}

export interface Informe {
  datos: DatosInforme;
  resumen: string | null;
}

/** Lo que devuelve informe_publico: null, vencido, o el informe. */
export type ResultadoInforme = { estado: "no_encontrado" } | { estado: "vencido" } | ({ estado: "ok" } & Informe);

type Obj = Record<string, unknown>;

const esObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const fecha = (v: unknown): string | undefined => (typeof v === "string" && FECHA.test(v) ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const numONull = (v: unknown): number | null | undefined => (v === null || v === undefined ? null : num(v));
const texto = (v: unknown, max: number): string | undefined =>
  typeof v === "string" && v.length <= max ? v : undefined;

/** `datos` con la forma esperada, o null si falta algo imprescindible. */
export function leerDatos(v: unknown): DatosInforme | null {
  if (!esObj(v)) return null;
  const periodo = esObj(v.periodo) ? v.periodo : null;
  const numeros = esObj(v.numeros) ? v.numeros : null;
  const precio = esObj(v.precio) ? v.precio : {};
  const vehiculo = texto(v.vehiculo, 200);
  const dominio = texto(v.dominio, 20);
  const generado = fecha(v.generado_el);
  const desde = fecha(periodo?.desde);
  const hasta = fecha(periodo?.hasta);
  const visitas = num(numeros?.visitas_total);
  const consultas = num(numeros?.consultas_total);
  if (!vehiculo || !dominio || !generado || !desde || !hasta || visitas === undefined || consultas === undefined) {
    return null;
  }

  const serie: DiaInforme[] = [];
  for (const d of Array.isArray(v.serie) ? v.serie : []) {
    if (!esObj(d) || !fecha(d.fecha)) continue;
    serie.push({
      fecha: d.fecha as string,
      visitas: (num(d.visitas_catalogo) ?? 0) + (num(d.visitas_ml) ?? 0),
      consultas: num(d.consultas_catalogo) ?? 0,
    });
  }

  const origen = (Array.isArray(v.origen) ? v.origen : [])
    .filter(esObj)
    .map((o) => ({ fuente: texto(o.fuente, 60), visitas: num(o.visitas) }))
    .filter((o): o is { fuente: string; visitas: number } => !!o.fuente && o.visitas !== undefined && o.visitas > 0);

  const s = esObj(v.segmento) ? v.segmento : null;
  const segmento =
    s && texto(s.banda, 80) && num(s.n) !== undefined && num(s.p25) !== undefined && num(s.mediana) !== undefined
      && num(s.p75) !== undefined && texto(s.posicion, 80)
      ? {
          banda: s.banda as string,
          n: s.n as number,
          p25: s.p25 as number,
          mediana: s.mediana as number,
          p75: s.p75 as number,
          posicion: s.posicion as string,
        }
      : null;

  const yt = esObj(v.youtube) ? v.youtube : null;
  const youtube =
    yt && num(yt.views_acumuladas) !== undefined
      ? { views_acumuladas: yt.views_acumuladas as number, views_periodo: numONull(yt.views_periodo) ?? null }
      : null;

  const cambios = (Array.isArray(precio.cambios_periodo) ? precio.cambios_periodo : [])
    .filter(esObj)
    .map((c) => ({ fecha: fecha(c.fecha), precio_anterior: num(c.precio_anterior), precio_nuevo: num(c.precio_nuevo) }))
    .filter(
      (c): c is { fecha: string; precio_anterior: number; precio_nuevo: number } =>
        !!c.fecha && c.precio_anterior !== undefined && c.precio_nuevo !== undefined
    );

  return {
    generado_el: generado,
    vehiculo,
    anio: numONull(v.anio) ?? null,
    km: numONull(v.km) ?? null,
    dominio,
    tipo: v.tipo === "a_pedido" ? "a_pedido" : "programado",
    numero: numONull(v.numero) ?? null,
    periodo: { desde, hasta },
    dias_publicado: numONull(v.dias_publicado) ?? null,
    precio: {
      actual: numONull(precio.actual) ?? null,
      moneda: precio.moneda === "USD" ? "USD" : "ARS",
      cambios_periodo: cambios,
      sin_cambios_desde: texto(precio.sin_cambios_desde, 80) ?? null,
    },
    numeros: { visitas_total: visitas, consultas_total: consultas, conversion: numONull(numeros?.conversion) ?? null },
    ml_hasta: fecha(v.ml_hasta) ?? null,
    serie,
    origen,
    segmento,
    youtube,
    portales: (Array.isArray(v.portales) ? v.portales : [])
      .map((p) => (esObj(p) ? texto(p.nombre, 60) : undefined))
      .filter((p): p is string => !!p),
  };
}

/** La respuesta cruda de informe_publico (jsonb o null) -> estado de la página. */
export function leerResultado(v: unknown): ResultadoInforme {
  if (!esObj(v)) return { estado: "no_encontrado" };
  if (v.vencido === true) return { estado: "vencido" };
  const datos = leerDatos(v.datos);
  if (!datos) return { estado: "no_encontrado" };
  const resumen = typeof v.resumen === "string" && v.resumen.trim() ? v.resumen.trim().slice(0, 4000) : null;
  return { estado: "ok", datos, resumen };
}
