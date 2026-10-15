// Vuelta de la autorización OAuth de Mercado Libre (gestión: scripts/ml/autorizar.mjs).
// Sólo muestra el code para copiarlo: el canje por el token lo hace el script en la máquina
// de Mati (esta web no tiene el client_secret ni service_role). Es un route handler, no una
// página, a propósito: no carga el layout, así que no dispara el Pixel ni escribe web_eventos.
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const valido = /^TG-[A-Za-z0-9-]{10,200}$/.test(code);
  const cuerpo = valido
    ? `<p>Copiá este código y pegalo en la terminal (vence en 10 minutos):</p>
       <pre id="c">${code}</pre>
       <button onclick="navigator.clipboard.writeText(document.getElementById('c').textContent);this.textContent='Copiado'">Copiar</button>`
    : `<p>No llegó un código de autorización válido.</p>`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Autorización Mercado Libre</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 16px;background:#fff;color:#111}
pre{background:#f3f3f1;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-all;font-size:15px}
button{font-size:15px;padding:8px 16px;border-radius:8px;border:1px solid #ccc;background:#fafafa;cursor:pointer}</style>
</head><body><h1 style="font-size:20px">Mercado Libre · autorización</h1>${cuerpo}</body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}
