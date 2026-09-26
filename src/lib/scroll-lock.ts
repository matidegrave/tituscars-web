/**
 * Bloqueo del scroll del body compatible con iOS Safari (donde overflow:hidden
 * en el body no alcanza): el body pasa a position:fixed corrido -scrollY y al
 * desbloquear se restaura la posición.
 */

let scrollGuardado = 0;
let bloqueos = 0;

export function bloquearScroll() {
  if (bloqueos++ > 0) return;
  scrollGuardado = window.scrollY;
  const s = document.body.style;
  s.position = "fixed";
  s.top = `-${scrollGuardado}px`;
  s.left = "0";
  s.right = "0";
  s.width = "100%";
}

export function desbloquearScroll() {
  if (bloqueos === 0 || --bloqueos > 0) return;
  const s = document.body.style;
  s.position = "";
  s.top = "";
  s.left = "";
  s.right = "";
  s.width = "";
  window.scrollTo(0, scrollGuardado);
}
