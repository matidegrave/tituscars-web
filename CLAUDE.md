@AGENTS.md

# Reglas del repo

## Test e2e obligatorio (desde el 15-oct-2026)

Cualquier cambio que toque `src/proxy.ts`, `/autos`, caché/ISR/`revalidate`, o el
armado de links de WhatsApp NO se pushea a main sin correr `npm run test:e2e`
y que pase completo (contra el build de producción local: `npm run build &&
npx next start -p 3011`; nunca contra tituscars.com). Si el test no cubre lo que
cambiaste, primero agregá el caso a `scripts/e2e-catalogo.mjs`.

Para el caso de `/api/revalidate`, levantar el servidor y correr el test con el
mismo `REVALIDATE_SECRET` de prueba (inventado, nunca el de producción, sin
imprimirlo ni commitearlo).
