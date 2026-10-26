# Workflow de Pruebas de Seguridad y Carga (QA Phase 2)

Este documento es la **guía maestra y de comportamiento** para implementar las pruebas de Carga (Load) y Seguridad (Security) en el backend. 

A diferencia de las pruebas unitarias y E2E de contrato (que usan Mocks y prueban si el código es lógicamente correcto), esta fase se asegura de que el código **"aguante bajo estrés y sea impenetrable ante ataques"** operando exclusivamente sobre un stack real en Docker (PostgreSQL real, red real).

Como Asistente de IA, cada vez que se me pida aplicar esta arquitectura a un nuevo módulo, **DEBO SEGUIR ESTRICTAMENTE** el siguiente ciclo de vida paso a paso.

---

## 🚦 Reglas Fundamentales (Comportamiento de IA)

1. **PROHIBIDO MOCKEAR:** En las carpetas `test/security/` y `test/load/` no se permite el uso de Mocks (ni `PrismaServiceMock`, ni Mocks de Servicios). Se ataca a la aplicación consumiendo sus puertos reales o levantándola conectada a la base de datos real de pruebas.
2. **ENFOQUE NEGATIVO (ATACANTE):** Al escribir tests de seguridad, la mentalidad debe ser maliciosa. No buscamos el camino feliz. Buscamos romper los DTOs, engañar a los Guards, alterar los IDs de los recursos y eludir rate limits.
3. **MEDICIÓN PRIMERO, SOLUCIÓN DESPUÉS:** Siempre debemos intentar correr las pruebas de carga/seguridad para encontrar la falla *antes* de proponer el fix en el código de producción.

---

## 🔄 El Ciclo Módulo por Módulo (Paso a Paso)

Para cada módulo que vayamos a auditar y blindar, se deben seguir estos 5 pasos en orden:

### Paso 1: Preparación del Entorno (Seed Realista)
- **Analizar:** ¿Qué volumen de datos necesita este módulo para que una prueba de carga sea realista? (Ej. Para probar `venue-tables`, necesitamos miles de configuraciones; para `reservations`, miles de sillas ocupadas).
- **Acción:** Asegurar que los scripts de *seeding* o fixtures inyecten datos reales y masivos en la base de datos PostgreSQL de Docker antes de correr los tests.

### Paso 2: Desarrollo de la Batería Hostil (Security)
- **Ubicación:** `test/security/modules/{modulo}/{modulo}.security.spec.ts`
- **Herramientas:** Jest + Supertest.
- **Acciones a codificar:**
  1. **Mass Assignment:** Enviar campos no permitidos en el body (ej. `role: 'ADMIN'`, `isPaid: true`) para asegurar que el DTO los limpie o rechace.
  2. **IDOR (Insecure Direct Object Reference):** Un usuario autenticado intenta modificar, cancelar o leer recursos pertenecientes a un ID distinto al suyo.
  3. **Escalada de Privilegios:** Intentar golpear las rutas `/admin/*` sin JWT o con un JWT de cliente regular.
  4. **Inyecciones & Payload Toxico:** Enviar SQL malicioso en queries (ej. `?id=1' OR 1=1`) o strings excesivamente largos para tumbar la validación.

### Paso 3: Desarrollo de la Batería de Estrés (Load)
- **Ubicación:** `test/load/{modulo}-{flujo}.k6.js` (Ej. `venue-reservations-checkout.k6.js`)
- **Herramientas:** k6 (JavaScript).
- **Acciones a codificar:**
  1. **Spike Test (Pico):** Simular una avalancha masiva e inmediata de solicitudes (ej. apertura de taquilla). Útil para cazar *Race Conditions* (Overbooking).
  2. **Load Test (Carga sostenida):** Simular un tráfico pesado pero normal durante un tiempo prolongado. Útil para cazar lentitud de DB (Queries N+1, falta de índices) y pérdida de memoria.

### Paso 4: Ejecución y Diagnóstico (Atacar y Medir)
- Levantar el entorno (Docker).
- Disparar la batería de Seguridad y recopilar vulnerabilidades.
- Disparar la batería de Carga y registrar latencias (p95, p99) y peticiones por segundo (throughput).
- **Diagnóstico:** Identificar por qué falló. (¿Falta un índice en la DB? ¿Falta `whitelist: true` en el `ValidationPipe`? ¿Se necesita un Lock/Transacción Serializable en Prisma para evitar el overbooking?).

### Paso 5: Refactorización y Refuerzo (The Fix)
- Modificar el código en la carpeta `src/modules/{modulo}/` para cerrar las vulnerabilidades y optimizar las consultas encontradas en el diagnóstico.
- Agregar mecanismos como Rate Limiting, optimizar índices de base de datos, ajustar Guards o agregar Transacciones robustas.
- **Revalidación:** Volver a correr el Paso 4. El módulo sólo se aprueba cuando es inmune a las inyecciones y resiste los umbrales de carga.

---

## 📁 Arquitectura Esperada

El resultado final en el repositorio debe seguir este patrón:

```text
shamell-backend/
├── src/modules/{modulo}/            # (Código de producción, ahora blindado)
├── test/
│   ├── security/
│   │   └── modules/
│   │       └── {modulo}/{modulo}.security.spec.ts
│   └── load/
│       └── {modulo}-{accion}.k6.js
└── docker-compose.test.yml          # Stack que levanta DB real para estos tests
```

### Directriz Final
Al iniciar el trabajo en un módulo, el asistente leerá este documento para calibrar su contexto y procederá directamente con el **Paso 1** y **Paso 2** para dicho módulo.
