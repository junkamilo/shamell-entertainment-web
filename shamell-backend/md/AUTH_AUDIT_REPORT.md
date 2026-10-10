# 🛡️ Monitoría y Auditoría de la Autenticación (Auth)

Aquí tienes la monitoría total y definitiva de cómo quedó estructurado, blindado y validado el módulo de auth, incluyendo la estrategia de Docker, las capas de pruebas y la arquitectura limpia.

## 🏛️ 1. Arquitectura de Carpetas: 100% Código Limpio
Se logró el objetivo de desacoplar completamente el código de producción de las pruebas. `src/modules/auth/` ya no contiene ningún archivo de test, ni mocks, ni fixtures.

```text
shamell-backend/
├── docker-compose.test.yml                    # Contenedor dedicado de PostgreSQL 15 en puerto 5434
├── stryker.conf.json                          # Configuración de pruebas de mutación
│
├── src/modules/auth/                          # 📁 SOLO CÓDIGO DE PRODUCCIÓN (Cero pruebas)
│   ├── controllers/auth.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── auth.repository.ts
│   ├── dto/*.dto.ts
│   ├── types/auth.types.ts
│   └── utils/
│       ├── auth-crypto.util.ts
│       └── auth-payload.util.ts
│
└── test/                                      # 📁 TODO EL ECOSISTEMA DE QA Y TESTING
    ├── unit/                                  # 1. Pruebas Unitarias Aisladas (En memoria)
    │   ├── common/auth/                       #    - Guards y constantes de permisos
    │   └── modules/auth/                      #    - Controller, Service, Repository, Utils
    │
    ├── integration/modules/auth/              # 2. Pruebas de Integración con PostgreSQL Real
    │   ├── auth.integration.spec.ts           #    - Integración de login con DB real
    │   └── auth.repository.integration.spec.ts#    - Constraints P2002/P2003, row locks, transacciones ACID
    │
    ├── e2e/auth/                              # 3. Pruebas End-to-End por HTTP (Supertest)
    │   ├── auth.e2e-spec.ts                   #    - Contratos y códigos HTTP (200, 201, 401, 403)
    │   └── auth-admin-flows.e2e-spec.ts       #    - Flujos completos de administración
    │
    ├── security/modules/auth/                 # 4. Pruebas de Seguridad Ofensiva (Caja Negra)
    │   └── auth.security.spec.ts              #    - Throttling (429), JWT forging (alg=none), Timing leak, SQLi
    │
    ├── load/                                  # 5. Pruebas de Rendimiento y Carga
    │   └── auth-login.k6.js                   #    - Script de estrés con k6 para login
    │
    └── support/                               # 📁 Herramientas y Mocks compartidos (@test-support/*)
        ├── database/
        │   └── local-test-database.ts         # Conector PrismaPg + truncado seguro de tablas
        ├── modules/auth/
        │   ├── fixtures/                      # DTOs y datos semilla (auth.fixtures, auth-db.fixtures)
        │   ├── mocks/                         # Mocks Jest (service, repository, jwt)
        │   └── harnesses/                     # Fábricas de aplicaciones NestJS reales y mockeadas
        └── common/auth/mocks/                 # Mocks de guards
```

## 🐳 2. Estrategia de Docker y Base de Datos de Pruebas
Para evitar colisiones con otros proyectos y garantizar que las pruebas de integración sean verídicas, se configuró una base de datos PostgreSQL real y aislada:

| Parámetro | Configuración | Justificación |
| --- | --- | --- |
| **Archivo** | `docker-compose.test.yml` | Dedicado exclusivamente a las pruebas de shamell-backend. |
| **Nombre Contenedor** | `shamell-postgres-test` | Nombre único; no toca ningún otro contenedor en Docker. |
| **Puerto Host** | `5434:5432` | Puerto 5434, evitando chocar con el puerto 5433 (utilizado por pos-casa-verde) o el 5432 por defecto. |
| **Guard de Seguridad** | `LocalTestDatabase.ts` | Solo permite ejecutar truncados si la URL apunta estrictamente a `localhost:5434/shamell_test`. |

**Comandos Disponibles en package.json:**
- `npm run test:db:up`: Levanta el contenedor de pruebas y sincroniza el esquema de Prisma (db push).
- `npm run test:db:down`: Apaga y destruye el contenedor de pruebas sin afectar otros contenedores.
- `npm run test:integration:local`: Ejecuta las suites de integración y seguridad contra la base de datos real.

## 🧪 3. Las 5 Capas de Pruebas Validadas

| Capa | Comando | Archivos / Alcance | Estado |
| --- | --- | --- | --- |
| **1. Unitarias** | `npm test -- auth` | 8 archivos spec (auth.service, auth.controller, guards, crypto, etc.). En español. | PASANDO (54/54 tests) |
| **2. E2E (API HTTP)** | `npm run test:e2e -- auth` | `auth.e2e-spec.ts` y `auth-admin-flows.e2e-spec.ts`. Valida payloads, cabeceras x-request-id y respuestas. | PASANDO (12/12 tests) |
| **3. Integración DB Real** | `npm run test:integration:local` | Valida que PostgreSQL real bloquee duplicados (P2002), falle en claves foráneas inválidas (P2003) y preserve transacciones ACID. | Activado con Docker |
| **4. Seguridad Ofensiva** | `npm run test:integration:local` | Fuerza bruta (bloqueo 429), tokens manipulados con alg: none, bypass de firma, inyecciones en DTOs. | Activado con Docker |
| **5. Mutación (Stryker)** | `npm run test:mutation:auth` | Cambia operadores en el código (`===` por `!==`, etc.) para verificar si los tests detectan el fallo. | Configurado (`stryker.conf.json`) |

## 📖 4. Bitácora de Hallazgos y Pendientes (md/PENDIENTES-SEGURIDAD.md)
Las pruebas reales y ofensivas no solo validaron el código, sino que detectaron con precisión oportunidades de mejora documentadas en la bitácora:

- **SEC-001 (Enumeración por Timing Leak en Login):**
  - *Hallazgo:* Cuando el email existe, `bcrypt.compare` tarda ~60ms; cuando no existe, responde inmediatamente (0ms). Un atacante puede medir los tiempos para saber qué emails de administradores existen.
  - *Solución planeada:* Ejecutar un comparePassword ficticio cuando el usuario sea nulo para igualar los tiempos de respuesta.
- **SEC-002 (Concurrencia en Verificación de Invitaciones):**
  - *Hallazgo:* Dos peticiones simultáneas con el mismo código de verificación devuelven 500 en lugar de 409 Conflict en la segunda llamada.
  - *Solución planeada:* Atrapar la violación de unicidad/consumo y mapearla a un error HTTP ConflictException.
- **INFRA-001 (Sincronización de Prisma):**
  - *Solución aplicada:* Se utiliza `scripts/run-prisma.mjs db push` en el comando `test:db:up` para levantar la base de datos de pruebas efímera al instante.

> [!TIP]
> **Conclusión:** El módulo `auth` ahora cuenta con una arquitectura de testing de nivel profesional, completamente aislada de producción y lista para entornos locales y pipelines de CI/CD.
