/**
 * Visor de fotos a pantalla completa con PhotoSwipe v5. Se importa recién al
 * abrirlo (import dinámico): no suma peso al primer render de la ficha.
 *
 * - Pinch y doble tap hacen zoom; con zoom, arrastrar mueve la foto (pan) y
 *   no cambia de foto; el swipe horizontal cambia de foto sólo sin zoom.
 * - Swipe hacia abajo cierra, con el fondo desvaneciéndose.
 * - Contador "3 / 12", botón cerrar, Esc y el botón atrás del celu.
 */

export interface VisorAbierto {
  cerrar: () => void;
}

// Las fotos del catálogo son 4:3 (1600×1200 la mayoría). Es el tamaño inicial;
// si una foto real tiene otra proporción se corrige al cargarla.
const ANCHO = 1600;
const ALTO = 1200;

/** La foto por el optimizador de Next (AVIF/WebP, del ancho justo para la pantalla). */
function optimizada(url: string, ancho: number): string {
  return `/_next/image?url=${encodeURIComponent(url)}&w=${ancho}&q=75`;
}

export async function abrirVisorFotos({
  urls,
  indice,
  alt,
  miniatura,
  alCambiar,
  alCerrar,
}: {
  urls: string[];
  indice: number;
  alt: string;
  /** URL ya cargada de la foto tocada: se ve al instante mientras baja la grande. */
  miniatura?: string;
  alCambiar: (indice: number) => void;
  alCerrar: (indice: number) => void;
}): Promise<VisorAbierto> {
  const [{ default: PhotoSwipe }] = await Promise.all([
    import("photoswipe"),
    import("photoswipe/style.css"),
  ]);

  const pswp = new PhotoSwipe({
    dataSource: urls.map((url, i) => ({
      // Los mismos anchos que el resto de la web (next.config deviceSizes): así
      // el visor reusa las variantes ya optimizadas y no genera otras.
      src: optimizada(url, 1080),
      srcset: `${optimizada(url, 828)} 828w, ${optimizada(url, 1080)} 1080w`,
      width: ANCHO,
      height: ALTO,
      alt,
      msrc: i === indice ? miniatura : undefined,
    })),
    index: indice,
    bgOpacity: 1,
    showHideAnimationType: "fade",
    closeOnVerticalDrag: true,
    doubleTapAction: "zoom",
    wheelToZoom: true,
    closeTitle: "Cerrar",
    zoomTitle: "Zoom",
    arrowPrevTitle: "Anterior",
    arrowNextTitle: "Siguiente",
    errorMsg: "No se pudo cargar la foto",
  });

  // Proporción real de cada foto (la base no guarda ancho/alto; se arranca con
  // 4:3). Dos momentos:
  // - loadComplete: la foto termina de cargar y su slide ya existe.
  // - slideInit: se crea la slide de una foto que ya se había PRECARGADO
  //   (PhotoSwipe precarga la anterior y las 2 siguientes antes de crear su
  //   slide, y en ese caso no dispara loadComplete). Sin esto, una vertical a
  //   la que se llegaba deslizando se armaba con el 4:3 estimado y se veía
  //   estirada; al reabrirla, bien.
  type ContenidoPswp = {
    element?: HTMLElement;
    width: number;
    height: number;
    data: { width?: number; height?: number };
  };
  type SlidePswp = { width: number; height: number; content: ContenidoPswp; calculateSize(): void; updateContentSize(force?: boolean): void };
  const proporcionReal = (content: ContenidoPswp, slide: SlidePswp | undefined, recalcular: boolean) => {
    const img = content.element as HTMLImageElement | undefined;
    if (!img?.naturalWidth || !img.naturalHeight) return;
    const ancho = img.naturalWidth;
    const alto = img.naturalHeight;
    const igual = content.width && content.height && Math.abs(content.width / content.height - ancho / alto) < 0.01;
    if (!igual) {
      content.data.width = ancho;
      content.data.height = alto;
      content.width = ancho;
      content.height = alto;
    }
    if (slide && Math.abs(slide.width / slide.height - ancho / alto) >= 0.01) {
      slide.width = ancho;
      slide.height = alto;
      if (recalcular) {
        slide.calculateSize();
        slide.updateContentSize(true);
      }
    }
  };
  pswp.on("loadComplete", ({ content, slide }) => proporcionReal(content, slide, true));
  // En slideInit la slide todavía no se dibujó: alcanza con corregir el tamaño
  // (el cálculo del layout viene después y ya usa el correcto).
  pswp.on("slideInit", ({ slide }) => proporcionReal(slide.content, slide, false));

  pswp.on("change", () => alCambiar(pswp.currIndex));

  // Botón atrás del celu: abrir el visor suma una entrada al historial; volver
  // atrás lo cierra, y cerrarlo de otra forma saca esa entrada.
  const estado = { visorFotos: true };
  window.history.pushState({ ...window.history.state, ...estado }, "");
  // Si todavía está en la animación de apertura, PhotoSwipe ignora close():
  // se cierra apenas termina de abrir.
  const alVolver = () => {
    if (pswp.opener.isOpen) pswp.close();
    else pswp.on("openingAnimationEnd", () => pswp.close());
  };
  window.addEventListener("popstate", alVolver);

  pswp.on("destroy", () => {
    window.removeEventListener("popstate", alVolver);
    if (window.history.state?.visorFotos) window.history.back();
    alCerrar(pswp.currIndex);
  });

  pswp.init();
  return { cerrar: () => pswp.close() };
}
