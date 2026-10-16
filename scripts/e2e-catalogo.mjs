// E2E del catálogo: buscar, ordenar y filtrar en /autos tiene que cambiar los
// resultados SIN recargar, con y sin las cookies de pauta y de equipo.
//
// Por qué existe: el 14-oct /autos pasó a ser estática (caché por combinación
// de filtros con un rewrite del proxy) y el router de Next empezó a reusar la
// página al cambiar la query: buscar "focus" u ordenar por mayor precio
// cambiaba la URL pero no los resultados hasta recargar.
//
// Uso (contra el build local, nunca contra tituscars.com):
//   npm run build && npx next start -p 3011
//   npm run test:e2e                      (BASE=http://localhost:3011 por defecto)
// Navegadores: WebKit con un iPhone y Chromium de compu. Si faltan:
//   npx playwright-core install webkit chromium
// /api/track se intercepta (no se registra nada).
//
// También cubre (regla 15-oct: proxy, /autos, caché/ISR/revalidate o links de
// WhatsApp no van a main sin este test completo):
//  - home, ficha, /autos y /usados/hasta-15-millones cargan y TODOS sus links de
//    venta van al número que corresponde: pauta + "(ref: W1)" con las cookies
//    de pauta, portales sin ref sin cookies o en modo equipo.
//  - llegada por anuncio (?utm_medium=paid&utm_content=<ID de Meta>) sin
//    cookies previas: el proxy las pone y el link sale con pauta + W1. Sólo en
//    Chromium: las cookies del proxy son Secure y WebKit no las guarda por
//    http://localhost (en WebKit lo cubren las cookies puestas a mano).
//  - POST /api/revalidate: 401 sin secreto o con uno incorrecto; con el
//    correcto 200 y la ficha (ISR) se regenera. Necesita REVALIDATE_SECRET igual
//    en `next start` y en el test (uno de prueba, NUNCA el de producción); sin
//    la variable ese caso se saltea y avisa.
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium, devices, webkit } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3011";
const PAUTA = "5493515303712";
const PORTALES = process.env.NEXT_PUBLIC_WHATSAPP ?? "5493513283316";
const ANUNCIO_W1 = "120251049306750443"; // public.anuncios_ref -> W1

const ESCENARIOS = {
  "sin cookies": [],
  "pauta (tc_origen + tc_anuncio)": [
    { name: "tc_origen", value: "pauta" },
    { name: "tc_anuncio", value: ANUNCIO_W1 },
    { name: "tc_pauta_js", value: "1" },
  ],
  "equipo (tc_equipo)": [{ name: "tc_equipo", value: "1" }],
};

const NAVEGADORES = {
  "iPhone (WebKit)": { tipo: webkit, opciones: devices["iPhone 13"], buscador: "#filtro-busqueda-celu" },
  "compu (Chromium)": { tipo: chromium, opciones: { viewport: { width: 1366, height: 900 } }, buscador: null },
};

/** Las primeras fichas del listado (lo que se ve). */
const fichas = (page) =>
  page.$$eval('main a[href^="/autos/"]', (as) =>
    [...new Set(as.map((a) => a.getAttribute("href")))].slice(0, 6).join(",")
  );

for (const [nombreNav, nav] of Object.entries(NAVEGADORES)) {
  for (const [nombre, cookies] of Object.entries(ESCENARIOS)) {
    test(`/autos navega sin recargar — ${nombreNav}, ${nombre}`, async () => {
      const browser = await nav.tipo.launch();
      try {
        const ctx = await browser.newContext(nav.opciones);
        await ctx.addCookies(cookies.map((c) => ({ ...c, url: BASE })));
        await ctx.route("**/api/track", (r) => r.fulfill({ status: 204 }));
        const page = await ctx.newPage();
        const referencia = await ctx.newPage();

        // Lo que muestra la URL cargada de cero: los resultados correctos.
        const esperado = async (url) => {
          await referencia.goto(url);
          await referencia.waitForLoadState("networkidle");
          return fichas(referencia);
        };
        // Después de navegar (sin recargar), tiene que verse lo mismo.
        const verificar = async (paso, parteUrl) => {
          await page.waitForURL((u) => u.search.includes(parteUrl), { timeout: 10_000 });
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(500);
          const url = page.url();
          assert.equal(await fichas(page), await esperado(url), `${paso}: ${url} no muestra sus resultados`);
        };
        const aCatalogo = async () => {
          await page.goto(`${BASE}/autos`);
          await page.waitForLoadState("networkidle");
        };

        // 1. Buscador de la página
        await aCatalogo();
        const buscador = page.locator(nav.buscador ?? 'form[role="search"] input[name="q"]:visible').first();
        await buscador.fill("focus");
        await buscador.press("Enter");
        await verificar("buscar 'focus'", "q=focus");
        assert.match(await fichas(page), /focus/, "buscar 'focus' no trajo ningún Focus");

        // 1b. Lupa del header (tanda 50) desde otra página (en /autos la lupa
        // sólo lleva el foco al buscador de la página).
        await page.goto(`${BASE}/contacto`);
        await page.waitForLoadState("networkidle");
        const lupa = page.locator('summary[aria-label="Buscar autos"]:visible').first();
        assert.ok(await lupa.count(), "no se ve la lupa del header en /contacto");
        await lupa.click();
        const enHeader = page.locator('details[open] input[name="q"]').first();
        await enHeader.fill("focus");
        await enHeader.press("Enter");
        await verificar("lupa del header 'focus'", "q=focus");

        // 2. Orden: mayor precio
        await aCatalogo();
        await page.locator('select[name="orden"]:visible').first().selectOption("precio_desc");
        await verificar("orden mayor precio", "orden=precio_desc");

        // 3. Filtro (pestaña de condición)
        await aCatalogo();
        await page.locator('a[href^="/autos?condicion=0km"]:visible').first().click();
        await verificar("filtro 0km", "condicion=0km");
      } finally {
        await browser.close();
      }
    });
  }
}

// Venta esperada por escenario: número y ref del mensaje.
const VENTA = {
  "sin cookies": { numero: PORTALES, ref: null },
  "pauta (tc_origen + tc_anuncio)": { numero: PAUTA, ref: "W1" },
  "equipo (tc_equipo)": { numero: PORTALES, ref: null },
};

/** Links de venta de la página ya hidratada: [{numero, texto}] (sin los de consignas). */
async function linksVenta(page) {
  await page.waitForLoadState("networkidle");
  // El número de pauta y la ref se ponen al hidratar (components/linea-whatsapp.tsx):
  // esperar la hidratación de verdad, no un tiempo fijo. Con el servidor cargado
  // WebKit a veces hidrata después de networkidle + 800 ms, y el test leía el
  // HTML estático (portales) o el replaceState tardío del router le cortaba el
  // goto siguiente ("interrupted by another navigation", 15 y 16-oct).
  await page.waitForFunction(() => window.__TITUS_HIDRATO === true, null, { timeout: 15_000 });
  await page.waitForLoadState("networkidle"); // /api/anuncios-ref (W1)
  await page.waitForTimeout(300);
  const hrefs = await page.$$eval('a[href*="wa.me/"]', (as) => as.map((a) => a.href));
  return hrefs
    .map((h) => {
      const u = new URL(h);
      return { numero: u.pathname.replace("/", ""), texto: u.searchParams.get("text") ?? "" };
    })
    .filter((l) => !/consignar/i.test(l.texto));
}

function verificarVenta(links, esperado, pagina) {
  assert.ok(links.length > 0, `${pagina}: no hay links de WhatsApp de venta`);
  for (const l of links) {
    assert.equal(l.numero, esperado.numero, `${pagina}: link a ${l.numero} ("${l.texto.slice(0, 60)}")`);
    if (esperado.ref) {
      assert.ok(l.texto.endsWith(`(ref: ${esperado.ref})`), `${pagina}: sin "(ref: ${esperado.ref})": "${l.texto}"`);
    } else {
      assert.doesNotMatch(l.texto, /\(ref: /, `${pagina}: ref de más: "${l.texto}"`);
    }
  }
}

/** Una ficha publicada (la primera del catálogo). */
async function unaFicha() {
  const html = await (await fetch(`${BASE}/autos`)).text();
  const slug = html.match(/href="(\/autos\/[^"?#]+)"/)?.[1];
  assert.ok(slug, "no encontré ninguna ficha en /autos");
  return slug;
}

const PAGINAS = ["/", "/autos", "/usados/hasta-15-millones"];

for (const [nombreNav, nav] of Object.entries(NAVEGADORES)) {
  for (const [nombre, cookies] of Object.entries(ESCENARIOS)) {
    test(`páginas y WhatsApp de venta — ${nombreNav}, ${nombre}`, async () => {
      const ficha = await unaFicha();
      const browser = await nav.tipo.launch();
      try {
        const ctx = await browser.newContext(nav.opciones);
        await ctx.addCookies(cookies.map((c) => ({ ...c, url: BASE })));
        await ctx.route("**/api/track", (r) => r.fulfill({ status: 204 }));
        const page = await ctx.newPage();
        for (const ruta of [...PAGINAS, ficha]) {
          const res = await page.goto(`${BASE}${ruta}`);
          assert.equal(res?.status(), 200, `${ruta}: status ${res?.status()}`);
          if (ruta === ficha || ruta.startsWith("/usados")) {
            assert.ok(await page.locator("h1").count(), `${ruta}: sin <h1>`);
          }
          if (ruta.startsWith("/usados")) {
            assert.ok(await page.locator('main a[href^="/autos/"]').count(), `${ruta}: sin autos listados`);
          }
          verificarVenta(await linksVenta(page), VENTA[nombre], ruta);
        }
      } finally {
        await browser.close();
      }
    });
  }
}

test("llegada por anuncio (utm_medium=paid + ID de Meta) — compu (Chromium)", async () => {
  const ficha = await unaFicha();
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    await ctx.route("**/api/track", (r) => r.fulfill({ status: 204 }));
    const page = await ctx.newPage();
    // Entra por la ficha (lo típico de un anuncio) y después recorre el sitio.
    await page.goto(`${BASE}${ficha}?utm_source=ig&utm_medium=paid&utm_content=${ANUNCIO_W1}`);
    verificarVenta(await linksVenta(page), { numero: PAUTA, ref: "W1" }, `${ficha} (llegada)`);
    for (const ruta of PAGINAS) {
      await page.goto(`${BASE}${ruta}`);
      verificarVenta(await linksVenta(page), { numero: PAUTA, ref: "W1" }, `${ruta} (después de la llegada)`);
    }
  } finally {
    await browser.close();
  }
});

test("POST /api/revalidate: secreto y regeneración de la ficha", async (t) => {
  const post = (headers = {}) =>
    fetch(`${BASE}/api/revalidate`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ dominio: "E2E", motivo: "test e2e" }),
    });
  assert.equal((await post()).status, 401, "sin header tiene que dar 401");
  assert.equal((await post({ "x-revalidate-secret": "incorrecto" })).status, 401, "secreto incorrecto: 401");
  assert.equal((await fetch(`${BASE}/api/revalidate`)).status, 405, "GET: 405");

  const secreto = process.env.REVALIDATE_SECRET;
  if (!secreto) {
    t.skip("sin REVALIDATE_SECRET: no se prueba el 200 ni la regeneración");
    return;
  }
  const ficha = await unaFicha();
  const cache = async () => (await fetch(`${BASE}${ficha}`)).headers.get("x-nextjs-cache");
  await cache();
  assert.equal(await cache(), "HIT", `${ficha}: la ficha no sale del caché (ISR)`);
  assert.equal((await post({ "x-revalidate-secret": secreto })).status, 200, "secreto correcto: 200");
  assert.notEqual(await cache(), "HIT", `${ficha}: después del aviso sigue el HTML viejo`);
  assert.equal(await cache(), "HIT", `${ficha}: no volvió al caché después de regenerarse`);
});

// ─── Seguridad (16-oct) ─────────────────────────────────────────────────────

test("headers de seguridad en páginas y API", async () => {
  const ficha = await unaFicha();
  for (const ruta of ["/", "/autos", ficha, "/usados/hasta-15-millones", "/api/version"]) {
    const h = (await fetch(`${BASE}${ruta}`)).headers;
    assert.equal(h.get("x-content-type-options"), "nosniff", `${ruta}: X-Content-Type-Options`);
    assert.equal(h.get("referrer-policy"), "strict-origin-when-cross-origin", `${ruta}: Referrer-Policy`);
    assert.equal(h.get("x-frame-options"), "DENY", `${ruta}: X-Frame-Options`);
    assert.match(h.get("strict-transport-security") ?? "", /max-age=\d{7,}/, `${ruta}: HSTS`);
    assert.match(h.get("content-security-policy-report-only") ?? "", /frame-ancestors 'none'/, `${ruta}: frame-ancestors`);
  }
});

// Cada caso usa su propia IP (x-real-ip): en Vercel ese header lo pone la
// plataforma; acá sirve para no mezclar la cuenta con los otros tests.
const ipDePrueba = () => `198.51.100.${Math.floor(Math.random() * 250) + 1}`;

test("rate limit de /api/track: 30 por minuto por IP", async () => {
  const ip = ipDePrueba();
  const estados = [];
  // Cuerpo con tipo inválido: el endpoint lo ignora (no registra ni simula nada).
  for (let i = 0; i < 31; i++) {
    const r = await fetch(`${BASE}/api/track`, { method: "POST", headers: { "x-real-ip": ip }, body: "{}" });
    estados.push(r.status);
  }
  assert.deepEqual(estados.slice(0, 30), Array(30).fill(204), "los primeros 30 tienen que entrar");
  assert.equal(estados[30], 429, "el 31 tiene que dar 429");
});

test("rate limit del formulario 'Te lo buscamos': 3 cada 10 min por IP", async () => {
  const ip = ipDePrueba();
  const estados = [];
  // Honeypot lleno: el servidor responde ok sin guardar (ni simular) nada.
  for (let i = 0; i < 4; i++) {
    const r = await fetch(`${BASE}/api/busqueda-a-medida`, {
      method: "POST",
      headers: { "x-real-ip": ip, "content-type": "application/json" },
      body: JSON.stringify({ web: "bot" }),
    });
    estados.push(r.status);
  }
  assert.deepEqual(estados, [200, 200, 200, 429]);
  // El tope de 5 por hora no se prueba acá (haría falta esperar 10 min).
});

test("formulario 'Te lo buscamos': rechaza campos largos o desconocidos", async () => {
  const enviar = (cuerpo) =>
    fetch(`${BASE}/api/busqueda-a-medida`, {
      method: "POST",
      headers: { "x-real-ip": ipDePrueba(), "content-type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
  assert.equal((await enviar({ observaciones: "x".repeat(1001) })).status, 400, "observaciones > 1000");
  assert.equal((await enviar({ modelos_buscados: "x".repeat(301) })).status, 400, "modelos_buscados > 300");
  assert.equal((await enviar({ datos: { inventado: "x" } })).status, 400, "clave desconocida en datos");
  assert.equal((await enviar({ origen: "otro" })).status, 400, "origen desconocido");
  assert.equal((await enviar("x".repeat(9000))).status, 400, "cuerpo > 8 KB");
});

// ─── Proxy (src/proxy.ts): bots, cookies de pauta y fichas que no existen ────

test("proxy: bloqueo de bots (tanda 46)", async () => {
  const ficha = await unaFicha();
  const pedir = (ruta, ua, metodo = "GET") =>
    fetch(`${BASE}${ruta}`, { method: metodo, redirect: "manual", headers: { "user-agent": ua } }).then((r) => r.status);
  const META = "meta-externalads/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)";
  const GOOGLE = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
  const PERSONA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
  assert.equal(await pedir("/autos?q=focus", META), 403, "bot en /autos con filtros: 403");
  assert.equal(await pedir("/api/track", META, "POST"), 403, "bot en /api/track: 403");
  assert.equal(await pedir("/autos", META), 200, "bot en /autos sin query: abierto");
  assert.equal(await pedir("/autos?utm_source=fb&utm_medium=paid", META), 200, "URL de anuncio: abierta");
  assert.equal(await pedir(ficha, META), 200, "bot en una ficha: abierta");
  assert.equal(await pedir("/", META), 200, "bot en la home: abierta");
  assert.equal(await pedir("/autos?q=focus", GOOGLE), 200, "Googlebot no se bloquea");
  assert.equal(await pedir("/autos?q=focus", PERSONA), 200, "una persona no se bloquea");
});

test("proxy: cookies de pauta en la llegada por anuncio", async () => {
  const r = await fetch(`${BASE}/?utm_source=ig&utm_medium=paid&utm_content=${ANUNCIO_W1}&utm_campaign=prueba`, {
    redirect: "manual",
  });
  assert.equal(r.status, 200);
  const cookies = r.headers.getSetCookie();
  const de = (nombre) => cookies.find((c) => c.startsWith(`${nombre}=`)) ?? "";
  assert.match(de("tc_origen"), /^tc_origen=pauta;/, "tc_origen=pauta");
  assert.match(de("tc_anuncio"), new RegExp(`^tc_anuncio=${ANUNCIO_W1};`), "tc_anuncio = ID del anuncio");
  assert.match(de("tc_campana"), /^tc_campana=prueba;/, "tc_campana");
  for (const n of ["tc_origen", "tc_anuncio", "tc_campana"]) {
    assert.doesNotMatch(de(n), /HttpOnly/i, `${n} tiene que ser legible desde JS`);
    assert.match(de(n), /Secure/i, `${n} Secure`);
    assert.match(de(n), /SameSite=lax/i, `${n} SameSite=Lax`);
    assert.match(de(n), /Max-Age=604800/i, `${n} 7 días`);
  }
  // Sin utm_medium=paid no toca nada.
  const sin = await fetch(`${BASE}/?utm_source=ig&fbclid=abc`, { redirect: "manual" });
  assert.equal(sin.headers.getSetCookie().filter((c) => /^tc_(origen|anuncio|campana)=/.test(c)).length, 0);
});

test("proxy: ficha que no existe da 404 y /autos no se cachea", async () => {
  const r = await fetch(`${BASE}/autos/no-existe-este-auto-2001-zzzzzz`, { redirect: "manual" });
  assert.equal(r.status, 404, "ficha inexistente: 404");
  // /autos es dinámica (lee la query): nunca sale del caché de páginas.
  const a = await fetch(`${BASE}/autos?q=focus`);
  assert.notEqual(a.headers.get("x-nextjs-cache"), "HIT", "/autos?q=… no puede salir del caché de páginas");
  assert.match(a.headers.get("cache-control") ?? "", /no-store|private|max-age=0/, "/autos: sin caché compartida");
});
