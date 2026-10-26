
# Pendientes de seguridad y calidad — shamell-backend

Registro de vulnerabilidades y deudas encontradas por las pruebas reales
(integración, seguridad, carga y mutación). **Aún no se han corregido en el código.**
Se va actualizando a medida que agregamos pruebas a cada módulo.

**Cómo reproducir todo:**

```bash
npm run test:db:up              # levanta shamell-postgres-test (puerto 5434)
npm run test:integration:local  # integración + seguridad contra PostgreSQL real
npm run test:mutation:auth      # mutación (Stryker) sobre auth
```

**Cómo agregar un hallazgo nuevo:** copia el bloque de una entrada, usa el siguiente ID
(`SEC-xxx` para vulnerabilidades, `QA-xxx` para calidad de pruebas, `INFRA-xxx` para
infraestructura), deja la prueba que lo detecta en rojo y anota aquí el nombre exacto de
esa prueba. Cuando se corrija, cambia el estado a ✅ y anota la fecha y el commit.

---

## Resumen

| ID | Módulo | Severidad | Título | Estado |
|---|---|---|---|---|
| SEC-001 | auth | Media | Enumeración de admins por tiempo de respuesta en login | ⏳ Pendiente |
| SEC-002 | auth | Media | Verificaciones concurrentes de una invitación devuelven 500 | ⏳ Pendiente |
| QA-001 | auth | Media | Mutation score de auth por debajo del umbral (48.74% < 50%) | ⏳ Pendiente |
| INFRA-001 | prisma | Media | El historial de migraciones no se puede reconstruir en una BD vacía | ⏳ Pendiente |

---

## SEC-001 — Enumeración de admins por tiempo de respuesta en login

- **Módulo:** auth — `POST /api/v1/auth/admin/login` (y su alias `POST /api/v1/auth/login`)
- **Severidad:** Media
- **Detectado:** 2026-10-10
- **Dónde:** `src/modules/auth/services/auth.service.ts` → `loginAdmin()` (líneas ~119-133)
- **Problema:** si el email no existe, la función responde de inmediato (línea 122).
  Si el email existe, ejecuta `bcrypt.compare` (línea 130), que tarda unos 60 ms.
  El mensaje es el mismo (`Invalid credentials`), pero el **tiempo** revela qué emails
  son cuentas reales, que además son cuentas de administración.
- **Evidencia:** diferencia de medianas medida de **58-59 ms** en dos corridas (límite de la prueba: 30 ms).
- **Prueba que lo detecta:**
  `test/security/modules/auth/auth.security.spec.ts` →
  `User enumeration on login › takes a similar time for unknown email and wrong password (timing leak)`
- **Mitigación actual:** el rate limit de 10 intentos por minuto y por IP frena la enumeración masiva, pero no la evita.
- **Corrección propuesta:** cuando `user` es `null` (o no tiene password), ejecutar
  igualmente `comparePassword(dto.password, DUMMY_BCRYPT_HASH)` con un hash fijo de 10 rondas
  antes de lanzar `UnauthorizedException`, para que los dos caminos tarden lo mismo.
- **Estado:** ⏳ Pendiente

## SEC-002 — Verificaciones concurrentes de una invitación devuelven 500

- **Módulo:** auth — `POST /api/v1/auth/admin/invite/verify`
- **Severidad:** Media (no permite crear dos admins, pero rompe el contrato de la API y ensucia los logs de errores)
- **Detectado:** 2026-10-10
- **Dónde:** `src/modules/auth/services/auth.service.ts` → `verifyAdminInvite()` (líneas ~275-310)
- **Problema:** dos peticiones simultáneas con el mismo email y código pasan las dos la
  validación previa (`findValidInviteByEmail` y `findUserIdByEmail`). La segunda falla en
  `consumeInviteAndCreateAdmin` con un error de unicidad de Prisma (`P2002` en `users.email`).
  El `catch` (línea 304) solo traduce `INVITE_ALREADY_USED`, así que ese error llega como **500**.
- **Evidencia:** respuestas `[201, 500]` en dos corridas. La integridad sí se mantiene:
  solo se crea **un** admin.
- **Prueba que lo detecta:**
  `test/security/modules/auth/auth.security.spec.ts` →
  `Concurrent verification of the same invite › two simultaneous verifications create exactly one admin and never return 500`
- **Corrección propuesta:** en el `catch` de `verifyAdminInvite`, tratar también
  `Prisma.PrismaClientKnownRequestError` con `code === 'P2002'` como
  `ConflictException('Invitation was already used.')`.
- **Estado:** ⏳ Pendiente

## QA-001 — Mutation score de auth por debajo del umbral

- **Módulo:** auth (`src/modules/auth`, `src/common/auth`)
- **Severidad:** Media (las pruebas unitarias no detectan muchos cambios de lógica)
- **Detectado:** 2026-10-10 con `npm run test:mutation:auth`
- **Resultado:** **48.74 %** en total (umbral mínimo `break: 50`, objetivo `high: 80`).
  Reporte HTML: `reports/mutation/auth.html`

  | Archivo | Score | Mutantes vivos | Sin cobertura |
  |---|---|---|---|
  | `auth.repository.ts` | 20.99 % | 10 | 54 |
  | `auth.service.ts` | 49.19 % | 82 | 43 |
  | `admin-jwt.guard.ts` | 57.78 % | 17 | 2 |
  | `admin-permissions.constants.ts` | 71.70 % | 15 | 0 |
  | `require-permissions.guard.ts` | 80.95 % | 4 | 0 |
  | `auth.constants.ts` | 0 % | 5 | 0 |
  | `current-admin.decorator.ts` | 0 % | 0 | 7 |
  | `auth.controller.ts` | 37.50 % | 0 | 5 |

- **Corrección propuesta:** reforzar los unit tests de `auth.service.ts` y `auth.repository.ts`,
  que concentran la mayoría de los mutantes vivos. Revisar en el reporte HTML qué mutantes sobreviven.
- **Estado:** ⏳ Pendiente

## INFRA-001 — El historial de migraciones no se puede reconstruir en una BD vacía

- **Módulo:** prisma (`prisma/migrations`)
- **Severidad:** Media (no afecta a producción; bloquea CI y entornos nuevos)
- **Detectado:** 2026-10-10
- **Problema:** `20260527120000_venue_standalone_chairs_inventory` ya crea las columnas en camelCase
  (`chairName`), pero `20260527200000_fix_venue_standalone_chairs_columns` intenta renombrar
  `chair_name`, que no existe en una base nueva. `prisma migrate deploy` falla con `P3018` / `42703`.
  Puede haber más migraciones afectadas después de esta.
- **Solución temporal:** la BD de pruebas se crea con `prisma db push` desde `schema.prisma`
  (`npm run test:db:up`), sin tocar las migraciones.
- **Corrección propuesta:** crear una migración baseline desde el estado actual de producción,
  o hacer idempotente la migración `20260527200000`.
- **Estado:** ⏳ Pendiente
