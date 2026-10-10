# Migración: estructura de QA 100% fuera de `src/`

**Módulo piloto:** `auth`
**Objetivo:** que todo el ambiente de pruebas (unit, integration, e2e, mocks, fixtures, harnesses) viva bajo `test/`, sin un solo `*.spec.ts` ni `__mocks__/` dentro de `src/`.

Acompaña a este documento el script `migrate-auth-tests.sh` (usa `git mv`, preserva historial, trae modo `--dry-run`).

---

## 1. Estructura actual (diagnóstico)

```
src/modules/auth/
├── controllers/auth.controller.spec.ts
├── services/{auth.service,auth.repository}.spec.ts
├── utils/{auth-crypto.util,auth-payload.util}.spec.ts
├── auth.integration.spec.ts
├── __mocks__/                 # fixtures + mocks mezclados con código
└── testing/                   # harnesses de boot de la app

test/
├── common/auth/
│   ├── constants/admin-permissions.constants.spec.ts
│   ├── guards/*.spec.ts
│   └── __mocks__/*.mock.ts
└── e2e/auth/*.e2e-spec.ts
```

**Problemas:**
- Testing mezclado con código de producción en `src/` (unitarias + mocks + harnesses).
- Dos convenciones distintas conviviendo: co-ubicación en `src/` vs. centralización en `test/`.
- Advertencia de `jest-haste-map` por dos archivos `__mocks__/contact-inbox.service.mock.ts` con el mismo nombre en módulos distintos (`agenda` y `contact`).

---

## 2. Estructura objetivo

```
src/modules/auth/                         # SOLO código de producción
├── controllers/auth.controller.ts
├── services/{auth.service,auth.repository}.ts
└── utils/{auth-crypto.util,auth-payload.util}.ts

test/
├── unit/
│   ├── modules/auth/
│   │   ├── controllers/auth.controller.spec.ts
│   │   ├── services/{auth.service,auth.repository}.spec.ts
│   │   └── utils/{auth-crypto.util,auth-payload.util}.spec.ts
│   └── common/auth/
│       ├── constants/admin-permissions.constants.spec.ts
│       └── guards/*.spec.ts
│
├── integration/
│   └── modules/auth/auth.integration.spec.ts
│
├── e2e/auth/                             # sin cambios de ruta
│   ├── auth.e2e-spec.ts
│   └── auth-admin-flows.e2e-spec.ts
│
└── support/                              # reemplaza __mocks__/ y testing/
    ├── modules/auth/
    │   ├── fixtures/auth.fixtures.ts
    │   ├── mocks/{auth.service,auth.repository,jwt.service}.mock.ts
    │   └── harnesses/{auth-http-app,auth-service.test-module,auth.test-types}.ts
    └── common/auth/mocks/{admin-jwt.guard,require-permissions.guard}.mock.ts
```

`support/` agrupa todo lo que **no es en sí mismo una prueba** (fixtures, mocks, harnesses) y espeja la ruta del módulo real. Esto además resuelve el warning de `jest-haste-map`: al dejar de usar la carpeta mágica `__mocks__`, Jest ya no escanea el árbol completo buscando coincidencias de nombre.

---

## 3. Pasos de migración

### 3.1 Pre-requisitos
- Working tree limpio (`git status` sin cambios pendientes).
- Ejecutar todo desde la raíz del repo (`shamell-backend/`).

### 3.2 Ejecutar el script
```bash
chmod +x migrate-auth-tests.sh

# 1) Verifica qué se va a mover, sin tocar nada
./migrate-auth-tests.sh --dry-run

# 2) Si el listado se ve correcto, ejecuta de verdad
./migrate-auth-tests.sh
```

El script usa `git mv`, así que el historial de cada archivo se conserva. También borra las carpetas vacías que queden en `src/modules/auth/` y `test/common/auth/` al final.

### 3.3 Actualizar alias de rutas (`tsconfig.json`)
Los `.spec.ts` movidos importaban el código con rutas relativas (`./auth.service`), que al salir de `src/` se vuelven largas y frágiles (`../../../../../src/...`). Agrega alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["src/*"],
      "@test-support/*": ["test/support/*"]
    }
  }
}
```

### 3.4 Actualizar `jest.config.ts`
```ts
export default {
  // ...config existente
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@test-support/(.*)$': '<rootDir>/test/support/$1',
  },
  roots: ['<rootDir>/test/unit', '<rootDir>/test/integration'],
  testRegex: '.*\\.spec\\.ts$',
};
```
La config de e2e (probablemente `jest-e2e.json` o similar, apuntando a `test/e2e`) **no cambia**.

### 3.5 Corregir los `jest.mock()` sin factory
Si algún spec hace `jest.mock('./auth.repository')` sin segundo argumento, dependía de que `__mocks__/` estuviera *adyacente* al archivo real — eso ya no aplica. Busca todos los casos:

```bash
grep -rn "jest.mock(" test/unit test/integration | grep -v "=>"
```

Y conviértelos a mock explícito:

```ts
jest.mock('@app/modules/auth/services/auth.repository', () =>
  require('@test-support/modules/auth/mocks/auth.repository.mock'),
);
```

### 3.6 Actualizar imports internos de cada spec movido
Cambia las rutas relativas por los alias nuevos. Ejemplo en `test/unit/modules/auth/services/auth.service.spec.ts`:

```diff
- import { AuthService } from '../auth.service';
- import { createAuthRepositoryMock } from '../__mocks__/auth.repository.mock';
+ import { AuthService } from '@app/modules/auth/services/auth.service';
+ import { createAuthRepositoryMock } from '@test-support/modules/auth/mocks/auth.repository.mock';
```

### 3.7 Validar
```bash
npm run test
npm run test:e2e
```
Si algo rompe, casi siempre es uno de estos dos: un import relativo que falta por actualizar, o un `jest.mock()` implícito que todavía esperaba la carpeta `__mocks__`.

---

## 4. Checklist

- [ ] `./migrate-auth-tests.sh --dry-run` revisado
- [ ] `./migrate-auth-tests.sh` ejecutado
- [ ] `tsconfig.json` con `paths` actualizado
- [ ] `jest.config.ts` con `moduleNameMapper` + `roots` actualizado
- [ ] `grep` de `jest.mock()` sin factory resuelto
- [ ] Imports internos de cada `.spec.ts` actualizados a alias
- [ ] `npm run test` en verde
- [ ] `npm run test:e2e` en verde
- [ ] `src/modules/auth/` sin ningún `.spec.ts`, `__mocks__/` ni `testing/`

---

## 5. Siguiente paso

Este documento y el script cubren únicamente `auth`, como módulo piloto. Una vez validado en verde, el mismo patrón (`unit/ · integration/ · e2e/ · support/`, espejando `modules/<nombre>`) se replica módulo por módulo para el resto del backend.
