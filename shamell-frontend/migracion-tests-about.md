# Guía de migración de tests a `test/` — Piloto: módulo `about`

> **Objetivo**: centralizar todo el ambiente QA del frontend fuera de `src/`, bajo `test/`, replicando el árbol de `features/` (misma filosofía que la migración del backend, que arrancó con `auth`). `about` es el módulo piloto: una vez validado, el resto de módulos se migra con el mismo patrón.

---

## 0. Principio rector

- **El código de producción NO se mueve.** Los `.tsx`/`.ts` de los componentes, hooks, lib y services se quedan en `src/features/admin/about/`.
- **Solo se mueven los tests y su infraestructura.** Todo lo que sea `*.spec.ts(x)`, fixtures, handlers MSW, helpers y mocks del módulo pasa a `test/`.
- **`test/` espeja `features/`.** La ruta de un test es predecible: el spec de `src/features/admin/about/components/X.tsx` vive en `test/features/admin/about/components/X.spec.tsx`.
- **Separación de soporte**: infra *global* (antes `src/test/`) → `test/support/`; infra *del módulo* (antes `about/test/`) → `test/features/admin/about/support/`.

> **Único trade-off real que aceptas al elegir espejo completo**: pierdes la colocación test↔componente (ya no están lado a lado). A cambio ganas un árbol de QA unificado con dueño único y paridad con el backend. Esta guía asume que ya tomaste esa decisión.

---

## 1. Estructura destino

```
test/
├── support/                              # infra GLOBAL (antes src/test/)
│   ├── setup.ts                          # matchers jest-dom, mocks de navegación, arranque MSW
│   ├── server.ts                         # agregador central de handlers MSW
│   ├── mockR3fJsxAsDom.ts                # React Three Fiber sin WebGL
│   └── mockHtmlCanvasGetContext.ts
│
└── features/
    └── admin/
        └── about/
            ├── components/               # specs de componentes (jsdom)
            │   ├── AboutAdminPage.spec.tsx
            │   ├── AboutDeleteHeroModal.spec.tsx
            │   ├── AboutEditModal.spec.tsx
            │   ├── AboutEditorialPreview.spec.tsx
            │   ├── AboutEmptyState.spec.tsx
            │   ├── AboutHeroLightbox.spec.tsx
            │   ├── AboutHeroPreviewCard.spec.tsx
            │   └── AboutStatsGrid.spec.tsx
            │
            ├── hooks/                     # specs de hooks (jsdom si usan render/renderHook)
            │   └── *.spec.ts(x)
            │
            ├── services/                  # specs de servicios (node)
            │   └── *.spec.ts
            │
            ├── lib/                       # specs de utilidades puras (node)
            │   └── *.spec.ts
            │
            └── support/                   # infra DEL MÓDULO (antes about/test/)
                ├── fixtures/              # datos de prueba del módulo
                ├── mocks/
                │   └── handlers.ts        # handlers MSW de about
                └── helpers/               # render helpers, builders, etc.
```

**Lo que NO se mueve de `about/`:**
- `components/*.tsx`, `hooks/*.ts(x)`, `lib/*.ts`, `services/*.ts` → se quedan en `src/`.
- `types/` (`aboutAdmin.types.ts`, `index.ts`) → se queda en `src/`. No tiene tests y ya está excluido de cobertura.

---

## 2. Mapeo origen → destino

### 2.1 Componentes (confirmados en la captura)

| Origen (`src/features/admin/about/components/`) | Destino (`test/features/admin/about/components/`) |
|---|---|
| `AboutAdminPage.spec.tsx`        | `AboutAdminPage.spec.tsx`        |
| `AboutDeleteHeroModal.spec.tsx`  | `AboutDeleteHeroModal.spec.tsx`  |
| `AboutEditModal.spec.tsx`        | `AboutEditModal.spec.tsx`        |
| `AboutEditorialPreview.spec.tsx` | `AboutEditorialPreview.spec.tsx` |
| `AboutEmptyState.spec.tsx`       | `AboutEmptyState.spec.tsx`       |
| `AboutHeroLightbox.spec.tsx`     | `AboutHeroLightbox.spec.tsx`     |
| `AboutHeroPreviewCard.spec.tsx`  | `AboutHeroPreviewCard.spec.tsx`  |
| `AboutStatsGrid.spec.tsx`        | `AboutStatsGrid.spec.tsx`        |

> Los `.tsx` (sin `.spec`) **se quedan** en `src`.

### 2.2 Hooks / services / lib (misma regla, nombres por confirmar en el repo)

| Origen | Destino |
|---|---|
| `src/features/admin/about/hooks/<nombre>.spec.ts(x)`   | `test/features/admin/about/hooks/<nombre>.spec.ts(x)`   |
| `src/features/admin/about/services/<nombre>.spec.ts`   | `test/features/admin/about/services/<nombre>.spec.ts`   |
| `src/features/admin/about/lib/<nombre>.spec.ts`        | `test/features/admin/about/lib/<nombre>.spec.ts`        |

### 2.3 Infra del módulo

| Origen (`src/features/admin/about/test/`) | Destino (`test/features/admin/about/support/`) |
|---|---|
| `mocks/handlers.ts` | `support/mocks/handlers.ts` |
| `fixtures/*`        | `support/fixtures/*`        |
| `helpers/*`         | `support/helpers/*`         |

### 2.4 Infra global (una sola vez, no por módulo)

| Origen (`src/test/`) | Destino (`test/support/`) |
|---|---|
| `setup.ts`                    | `support/setup.ts`                    |
| `server.ts`                   | `support/server.ts`                   |
| `mockR3fJsxAsDom.ts`          | `support/mockR3fJsxAsDom.ts`          |
| `mockHtmlCanvasGetContext.ts` | `support/mockHtmlCanvasGetContext.ts` |

---

## 3. Convención de imports (el punto que más rompe)

Al sacar el spec de junto a su componente, los imports **relativos** dejan de resolver. Se cambian a **alias absoluto**.

**Antes** (spec colocado):
```ts
import { AboutStatsGrid } from "./AboutStatsGrid";
import { aboutHandlers } from "./test/mocks/handlers";
```

**Después** (spec en `test/`):
```ts
import { AboutStatsGrid } from "@/features/admin/about/components/AboutStatsGrid";
import { aboutHandlers } from "@test/features/admin/about/support/mocks/handlers";
```

Requisitos:
- `@/*` ya debe apuntar a `src/*` en `tsconfig.json` (lo estándar en Next.js). Verifícalo.
- Agrega un alias `@test/*` → `test/*` en `tsconfig.json` para los imports entre archivos de test:
  ```jsonc
  // tsconfig.json
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@test/*": ["./test/*"]
    }
  }
  ```
- Vitest debe honrar esos alias. La forma más robusta es el plugin `vite-tsconfig-paths` (lee `tsconfig` y evita duplicar la config). Si no lo usas, replica los alias en `resolve.alias` de `vitest.config.ts`.

> Regla de dedo: imports **a producción** → `@/…`; imports **entre tests** (handlers, fixtures, helpers) → `@test/…`. Nunca relativos que crucen de `test/` a `src/`.

---

## 4. Cambios en `vitest.config.ts`

### 4.1 `include` (coexistencia durante la migración)
Mientras migras módulo por módulo, Vitest tiene que encontrar specs en **ambos** sitios. Al terminar todo, se elimina la línea de `src/`.

```ts
test: {
  include: [
    "src/**/*.spec.{ts,tsx}",    // ← quitar cuando no quede ningún spec en src
    "test/**/*.spec.{ts,tsx}",
  ],
  exclude: [
    "**/node_modules/**",
    "**/*.cy.{ts,tsx}",          // los de Cypress NO los corre Vitest (ver §7)
    "e2e/**",
  ],
}
```

### 4.2 `setupFiles`
Apunta a la nueva ubicación global:
```ts
setupFiles: ["./test/support/setup.ts"],
```
Y dentro de `setup.ts`, actualiza la importación del server MSW a `./server` (ambos quedan en `test/support/`, así que no cambia el relativo si los mueves juntos).

### 4.3 `environmentMatchGlobs` → eliminar
Como documentaste, en Vitest 4 ya no existe y hoy **no es ella** la que activa jsdom: lo hace el pragma `// @vitest-environment jsdom` al inicio de cada `.spec.tsx`. Al mover los archivos:

- **Verifica que cada `.spec.tsx` conserve su pragma en la primera línea.** Es lo que de verdad selecciona el entorno; si se pierde en el corte/pega, el test corre en `node` y falla.
- Borra `environmentMatchGlobs` de la config (quedaba muerta).
- Entorno por defecto: `environment: "node"` (los `.spec.ts` puros lo usan; los `.spec.tsx` se suben a jsdom por pragma).

> **Alternativa limpia a futuro** (no ahora): migrar a `test.projects` con un proyecto `node` (`test/**/services/**`, `test/**/lib/**`) y uno `jsdom` (`test/**/components/**`, `test/**/hooks/**`). Déjalo para el cierre, cuando ya no quede nada en `src/`; durante el piloto, pragmas = cero riesgo.

---

## 5. MSW: reconectar los handlers al server central

`test/support/server.ts` agrega ~45 grupos de handlers importándolos de cada feature. Al mover los de `about`, hay que **actualizar su línea de import** en el agregador:

```ts
// test/support/server.ts
// antes:
// import { aboutHandlers } from "@/features/admin/about/test/mocks/handlers";
// después:
import { aboutHandlers } from "@test/features/admin/about/support/mocks/handlers";
```

- Es **una línea por módulo migrado**. Hazlo en el mismo commit que mueves el módulo.
- `onUnhandledRequest: "error"` en `setup.ts` es tu red de seguridad: si un handler quedó mal reconectado, el test falla de inmediato en vez de pasar en silencio.

---

## 6. Cypress — Component Testing para `about`

En vez de duplicar los E2E de Playwright, Cypress entra como **component testing** (tipo de QA que Playwright no cubre bien) sobre `about`. Conviven en la misma carpeta del módulo, diferenciados por extensión para que ningún runner pise al otro.

Estructura:
```
test/features/admin/about/components/
├── AboutStatsGrid.spec.tsx      # Vitest (unit/component en jsdom)
└── AboutStatsGrid.cy.tsx        # Cypress (component testing en navegador real)
```

Config:
```ts
// cypress.config.ts
export default defineConfig({
  component: {
    devServer: { framework: "next", bundler: "webpack" },
    specPattern: "test/**/*.cy.{ts,tsx}",
    supportFile: "test/support/cypress/component.ts",
  },
});
```

Reglas de no-colisión:
- **Vitest** solo `*.spec.{ts,tsx}` (ya excluido `*.cy.*` en §4.1).
- **Cypress** solo `*.cy.{ts,tsx}`.
- Soporte de Cypress en `test/support/cypress/` (separado del `setup.ts` de Vitest).

> Empieza con 1–2 `.cy.tsx` de componentes visualmente ricos (`AboutHeroLightbox`, `AboutEditorialPreview`) para validar el pipeline antes de escalar.

---

## 7. CI

Aprovecha la migración para cerrar el gap grande: hoy el CI solo corre `smoke:returns`.

```yaml
# .github/workflows/ci.yml — job frontend
- run: npm ci
- run: npm run lint
- run: npm test            # ← los 3785 tests de Vitest; no necesita backend (MSW)
- run: npm run build
- run: npm run start &
- run: npm run smoke:returns
# opcional en esta fase:
# - run: npx cypress run --component
```

- `npm test` es la línea que más valor agrega: sin ella, mover a `test/` no cambia que nadie los corra automáticamente.
- Añade `test/**` al disparador del workflow (hoy solo `push` a `main`/`master` y PRs; un push a `shamell-dev` no lo activa).

---

## 8. Checklist de verificación (en orden)

Ejecuta **después de mover `about` y antes de commitear**:

- [ ] `tsconfig.json` tiene `@/*` y `@test/*`.
- [ ] `vitest.config.ts`: `include` cubre `src/**` y `test/**`; `setupFiles` apunta a `test/support/setup.ts`; `environmentMatchGlobs` eliminado.
- [ ] Cada `.spec.tsx` movido conserva `// @vitest-environment jsdom` en la línea 1.
- [ ] Imports a producción en `@/…`; imports entre tests en `@test/…`; cero relativos cruzando `test/`↔`src/`.
- [ ] `server.ts` reconecta `aboutHandlers` a la nueva ruta.
- [ ] `src/features/admin/about/test/` queda **vacío** (o eliminado).
- [ ] `npx tsc --noEmit` pasa (detecta imports rotos antes de correr tests).
- [ ] `npm test -- test/features/admin/about` corre **solo** about y pasa (8 specs de componentes + hooks/services/lib).
- [ ] `npm test` completo sigue en verde (no rompiste el resto al tocar `server.ts`/config).
- [ ] `npm run lint` limpio.

---

## 9. Criterios de aceptación del piloto

El piloto `about` está "hecho" cuando:
1. No queda ningún `.spec` ni infra de test dentro de `src/features/admin/about/`.
2. La cobertura de `about` es idéntica (o mayor) a la de antes de mover — mover archivos no debe cambiar qué líneas de producción se cubren.
3. `npm test` pasa en local y en CI.
4. Al menos un `.cy.tsx` de Cypress corre verde.

---

## 10. Replicar al siguiente módulo

Una vez validado `about`, cada módulo es el mismo procedimiento acotado:

1. Mover `src/features/<ruta>/**/*.spec.*` → `test/features/<ruta>/**` (misma subcarpeta: components/hooks/services/lib).
2. Mover `src/features/<ruta>/test/` → `test/features/<ruta>/support/`.
3. Reescribir imports a `@/…` y `@test/…`.
4. Reconectar su línea de handlers en `test/support/server.ts`.
5. Correr el checklist §8 acotado a ese módulo.

**Cierre final** (cuando ya no quede nada en `src/`):
- Quitar `"src/**/*.spec.{ts,tsx}"` del `include`.
- (Opcional) Migrar de pragmas a `test.projects` para fijar el entorno por carpeta.

---

## Anexo — Comandos útiles

```bash
# Solo el módulo about
npm test -- test/features/admin/about

# Un archivo concreto
npm test -- test/features/admin/about/components/AboutStatsGrid.spec.tsx

# Chequeo de tipos (detecta imports rotos sin correr tests)
npx tsc --noEmit

# Cobertura del módulo
npm run test:coverage -- test/features/admin/about

# Cypress component
npx cypress run --component
```
