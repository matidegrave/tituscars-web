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
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium, devices, webkit } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3011";

const ESCENARIOS = {
  "sin cookies": [],
  "pauta (tc_origen + tc_anuncio)": [
    { name: "tc_origen", value: "pauta" },
    { name: "tc_anuncio", value: "120251049306750443" },
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
        if (await lupa.count()) {
          await lupa.click();
          const enHeader = page.locator('details[open] input[name="q"]').first();
          await enHeader.fill("focus");
          await enHeader.press("Enter");
          await verificar("lupa del header 'focus'", "q=focus");
        }

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
