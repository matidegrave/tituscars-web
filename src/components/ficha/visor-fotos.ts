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

/** La foto por el optimizador de Next (webp, del ancho justo para la pantalla). */
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
      src: optimizada(url, 1920),
      srcset: `${optimizada(url, 1080)} 1080w, ${optimizada(url, 1920)} 1920w`,
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

  // Proporción real de la foto, si no es 4:3.
  pswp.on("loadComplete", ({ content, slide }) => {
    const img = content.element as HTMLImageElement | undefined;
    if (!img?.naturalWidth || !slide) return;
    const real = img.naturalWidth / img.naturalHeight;
    if (Math.abs(real - ANCHO / ALTO) < 0.01) return;
    content.width = img.naturalWidth;
    content.height = img.naturalHeight;
    slide.width = img.naturalWidth;
    slide.height = img.naturalHeight;
    slide.calculateSize();
    slide.updateContentSize(true);
  });

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
