# Agregar Testcontainers a shamell-backend (integración con PostgreSQL real)

**Proyecto:** shamell-backend
**Alcance de este documento:** solo el contenedor nuevo para shamell. **No toca** `pos-casa-verde` (backend, postgres, pgadmin, redis) que ya tienes corriendo.

---

## 0. Antes de empezar — aislamiento de containers

Ya tienes corriendo (ver tu captura de Docker Desktop):

| Container | Imagen | Puerto host |
|---|---|---|
| `pos-casa-verde` → backend | — | 8080:8080 |
| `pos-casa-verde` → postgres | `pos-casa-v...` | **5433:5432** |
| `pos-casa-verde` → pgadmin | `dpage/pga...` | 5050:80 |
| `pos-casa-verde` → redis | `redis:7-alpi...` | 6379:6379 |

Todo lo que agregamos aquí usa **nombres de container distintos** y **un puerto host distinto** (`5434`, no `5433`), así que no hay colisión ni riesgo de pisar nada de `pos-casa-verde`. Dos garantías adicionales:

- **Testcontainers (lo que usan los tests automáticos) nunca necesita que tú elijas un puerto** — Docker le asigna uno aleatorio y libre cada vez que arranca un contenedor (`getConnectionUri()` ya trae ese puerto resuelto). Es físicamente imposible que choque con el `5433` de `pos-casa-verde`.
- **`docker-compose.test.yml`** (la opción manual para desarrollo local, ver sección 4) sí usa un puerto fijo — por eso aquí explícitamente usamos `5434` y un `container_name` único (`shamell-postgres-test`). Además, `docker compose` solo gestiona los containers definidos en *ese* archivo; correr `docker compose -f docker-compose.test.yml down` jamás toca containers de otro proyecto/carpeta, así que `pos-casa-verde` queda intacto sin importar qué comando corras aquí.

**Regla de oro:** nunca corras `docker compose down` sin `-f docker-compose.test.yml` desde la carpeta de `shamell-backend`, y nunca uses `docker rm`/`docker stop` sobre un container que no empiece por `shamell-`.

---

## 1. Qué corrigió la auditoría sobre el borrador anterior

El archivo `auth.integration.testcontainers.spec.ts` que te había pasado antes (`qa-auth-nivel2.zip`) era un borrador genérico y **no es compatible con tu proyecto real**. Dos incompatibilidades reales, detectadas al revisar tu código:

1. **Prisma 7 con adaptador:** tu backend inicializa Prisma con `@prisma/adapter-pg` sobre un `pg.Pool`, no con la sintaxis antigua `datasources: { db: { url } }`.
2. **Métodos reales del repositorio:** `AuthRepository` no tiene `createInvite()`/`verifyInvite()` (esos eran nombres de ejemplo). Los métodos reales son `createAdminInvite()`, `findValidInviteByEmail()` y `consumeInviteAndCreateAdmin()`.

Este documento ya trae la versión corregida con tu API real. **Reemplaza** el archivo del zip anterior por el de la sección 3.2.

---

## 2. Instalar dependencias

```bash
npm install -D @testcontainers/postgresql testcontainers
```

(`@prisma/adapter-pg` y `pg` asumo que ya los tienes, porque tu backend ya los usa en producción.)

---

## 3. Testcontainers (para CI y para "sí quiero la verdad absoluta" en local)

### 3.1 Harness reutilizable — `test/support/database/testcontainers.ts`

```typescript
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { execSync } from 'child_process';

/**
 * Levanta un PostgreSQL real y efímero en Docker, aplica las migraciones
 * reales de Prisma, y conecta un PrismaClient usando el mismo adaptador
 * (@prisma/adapter-pg) que usa el backend en producción.
 *
 * Se usa UNA instancia de este harness por archivo de test de integración
 * (no la compartas entre describe() de distintos módulos).
 */
export class TestDatabaseHarness {
  private container!: StartedPostgreSqlContainer;
  public pool!: Pool;
  public prisma!: PrismaClient;
  public databaseUrl!: string;

  async start(): Promise<void> {
    // 1. Levanta un Postgres 15 oficial en un puerto ALEATORIO y libre
    //    (Docker lo elige — nunca choca con otros containers tuyos).
    this.container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('shamell_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    this.databaseUrl = this.container.getConnectionUri();

    // 2. Aplica las migraciones reales de Prisma sobre el contenedor efímero
    execSync('npm run prisma:migrate', {
      env: { ...process.env, DATABASE_URL: this.databaseUrl },
      stdio: 'pipe',
    });

    // 3. Conecta Prisma con el mismo adaptador que usa el proyecto (Prisma 7 + pg)
    this.pool = new Pool({ connectionString: this.databaseUrl, max: 2 });
    this.prisma = new PrismaClient({ adapter: new PrismaPg(this.pool) });
    await this.prisma.$connect();
  }

  async stop(): Promise<void> {
    await this.prisma?.$disconnect();
    await this.pool?.end();
    await this.container?.stop();
  }
}
```

### 3.2 Test de integración de Auth — `test/integration/modules/auth/auth.integration.testcontainers.spec.ts`

Esta versión **reemplaza** la del zip anterior: usa los métodos reales de `AuthRepository`.

```typescript
import { TestDatabaseHarness } from '@test-support/database/testcontainers';
import { AuthRepository } from '@app/modules/auth/services/auth.repository';
import * as cryptoUtil from '@app/modules/auth/utils/auth-crypto.util';

describe('Auth — Integración con PostgreSQL real (Testcontainers)', () => {
  const dbHarness = new TestDatabaseHarness();
  let repository: AuthRepository;

  beforeAll(async () => {
    await dbHarness.start();
    repository = new AuthRepository(dbHarness.prisma as never);
  }, 60_000); // 60s: descargar/levantar la imagen de Postgres toma unos instantes

  afterAll(async () => {
    await dbHarness.stop();
  });

  it('rechaza invitaciones con email duplicado mediante el constraint único real de PostgreSQL', async () => {
    const inviteData = {
      email: 'duplicado@shamell.com',
      fullName: 'Admin Test',
      codeHash: cryptoUtil.sha256Hex('123456'),
      invitedById: 'admin-super-1',
      expiresAt: new Date(Date.now() + 60_000),
    };

    await repository.createAdminInvite(inviteData);

    // Segunda inserción con el mismo email: PostgreSQL dispara
    // violación de constraint único (P2002) — un mock nunca haría esto.
    await expect(repository.createAdminInvite(inviteData)).rejects.toThrow();
  });

  it('una invitación consumida en transacción ACID no puede ser reutilizada', async () => {
    const code = '987654';
    const invite = await repository.createAdminInvite({
      email: 'consumo@shamell.com',
      fullName: 'Admin Consumo',
      codeHash: cryptoUtil.sha256Hex(code),
      invitedById: 'admin-super-1',
      expiresAt: new Date(Date.now() + 60_000),
    });

    // Primera activación: exitosa
    await repository.consumeInviteAndCreateAdmin({
      inviteId: invite.id,
      email: 'consumo@shamell.com',
      fullName: 'Admin Consumo',
      passwordHash: await cryptoUtil.hashPassword('Password123!'),
    });

    // Intento de reusar la misma invitación: la transacción debe rechazarla
    await expect(
      repository.consumeInviteAndCreateAdmin({
        inviteId: invite.id,
        email: 'consumo@shamell.com',
        fullName: 'Admin Consumo',
        passwordHash: await cryptoUtil.hashPassword('OtraPassword!'),
      }),
    ).rejects.toThrow('INVITE_ALREADY_USED');
  });

  it('findValidInviteByEmail no devuelve invitaciones expiradas', async () => {
    await repository.createAdminInvite({
      email: 'expirada@shamell.com',
      fullName: 'Admin Expirado',
      codeHash: cryptoUtil.sha256Hex('111111'),
      invitedById: 'admin-super-1',
      expiresAt: new Date(Date.now() - 1_000), // ya expiró
    });

    const result = await repository.findValidInviteByEmail('expirada@shamell.com');
    expect(result).toBeNull();
  });
});
```

### 3.3 Correr estos tests

```bash
# Abre Docker Desktop primero (Windows) — sin el motor corriendo, Testcontainers falla al conectar.
npm run test:integration -- auth.integration.testcontainers
```

La primera corrida tarda más (descarga la imagen `postgres:15-alpine`); las siguientes son más rápidas porque la imagen queda cacheada localmente.

---

## 4. Alternativa para desarrollo local diario — `docker-compose.test.yml`

Testcontainers es ideal para CI (se autodestruye, cero configuración), pero levantar/bajar un container en cada corrida local puede sentirse lento (10-15s). Si quieres feedback instantáneo mientras programas, deja un Postgres de pruebas corriendo de forma persistente, aparte de Testcontainers.

### 4.1 `docker-compose.test.yml` (en la raíz de `shamell-backend`)

```yaml
services:
  postgres-test:
    image: postgres:15-alpine
    container_name: shamell-postgres-test   # nombre único — no choca con pos-casa-verde
    environment:
      POSTGRES_DB: shamell_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - '5434:5432'   # 5434, NO 5433 — ese ya lo usa pos-casa-verde
```

### 4.2 Levantarlo (aislado, sin tocar pos-casa-verde)

```bash
# Desde la raíz de shamell-backend:
docker compose -f docker-compose.test.yml -p shamell-backend-test up -d
```

El flag `-p shamell-backend-test` le da a este grupo de containers un nombre de proyecto propio, distinto al de `pos-casa-verde` — así `docker compose down` aquí jamás afecta a los containers del otro proyecto, aunque los corras desde la misma máquina.

Verifica que solo se creó lo esperado:

```bash
docker ps --filter "name=shamell-"
```

Deberías ver únicamente `shamell-postgres-test`. `pos-casa-verde` sigue en su lista aparte, intacto.

### 4.3 Script en `package.json`

```json
{
  "scripts": {
    "test:integration": "cross-env DATABASE_URL=postgresql://test:test@localhost:5434/shamell_test AUTH_INTEGRATION=1 jest test/integration"
  }
}
```

(Nota el puerto `5434`, coherente con el `docker-compose.test.yml` de arriba.)

### 4.4 Apagarlo cuando termines

```bash
docker compose -f docker-compose.test.yml -p shamell-backend-test down
```

---

## 5. ¿Testcontainers o docker-compose.test.yml?

| | Testcontainers (sección 3) | docker-compose.test.yml (sección 4) |
|---|---|---|
| Uso principal | CI/CD (GitHub Actions) | Desarrollo local diario |
| Setup previo | Ninguno — se crea y destruye solo | Tienes que levantarlo tú una vez |
| Velocidad por corrida | Más lento (~10-15s de arranque) | Instantáneo (ya está corriendo) |
| Riesgo de puerto fijo | Ninguno (puerto aleatorio) | Bajo, ya mitigado (puerto 5434) |
| Aislamiento entre corridas | Total — base de datos nueva cada vez | Compartida — puede acumular datos de prueba |

**Recomendación:** usa Testcontainers (sección 3) como la fuente de verdad para CI, y `docker-compose.test.yml` (sección 4) solo si el ciclo de 10-15s por corrida te frena mientras programas en el día a día.

---

## 6. Checklist

- [ ] Docker Desktop abierto y corriendo (`docker ps` no da error de conexión)
- [ ] `npm install -D @testcontainers/postgresql testcontainers`
- [ ] `test/support/database/testcontainers.ts` creado (sección 3.1)
- [ ] `test/integration/modules/auth/auth.integration.testcontainers.spec.ts` reemplazado por la versión corregida (sección 3.2)
- [ ] `npm run test:integration -- auth.integration.testcontainers` pasa en verde
- [ ] (Opcional) `docker-compose.test.yml` creado con puerto `5434` y `container_name: shamell-postgres-test`
- [ ] `docker ps --filter "name=shamell-"` confirma que `pos-casa-verde` sigue intacto y separado
