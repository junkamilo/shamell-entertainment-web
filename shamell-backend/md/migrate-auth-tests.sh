#!/usr/bin/env bash
# =============================================================================
# Migración del módulo auth hacia una estructura de QA 100% fuera de src/
# shamell-backend — módulo piloto: auth
#
# Qué hace:
#   - Mueve con `git mv` (preserva historial) todos los *.spec.ts, __mocks__/
#     y testing/ del módulo auth desde src/ hacia test/, reorganizados en
#     unit/ · integration/ · e2e/ · support/.
#   - NO toca código de producción (*.ts sin .spec, sin __mocks__/testing).
#   - Deja listo el árbol para que repliques el mismo patrón módulo por módulo.
#
# Requisitos antes de correrlo:
#   1. Ejecutar desde la raíz del repo (shamell-backend/).
#   2. Working tree limpio (sin cambios sin commitear) para poder revisar
#      el diff del `git mv` sin ruido.
#   3. Revisar primero el DRY-RUN (ver abajo) antes de ejecutar de verdad.
#
# Uso:
#   chmod +x migrate-auth-tests.sh
#   ./migrate-auth-tests.sh --dry-run   # solo imprime los movimientos
#   ./migrate-auth-tests.sh             # ejecuta los git mv de verdad
# =============================================================================

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

move() {
  local src="$1"
  local dst="$2"

  if [[ ! -e "$src" ]]; then
    echo "  [SKIP] no existe: $src"
    return
  fi

  mkdir -p "$(dirname "$dst")"

  if $DRY_RUN; then
    echo "  [DRY ] git mv '$src' '$dst'"
  else
    git mv "$src" "$dst"
    echo "  [OK  ] $src -> $dst"
  fi
}

echo "== 1. Unit tests: controllers / services / utils =="
move "src/modules/auth/controllers/auth.controller.spec.ts" \
     "test/unit/modules/auth/controllers/auth.controller.spec.ts"

move "src/modules/auth/services/auth.service.spec.ts" \
     "test/unit/modules/auth/services/auth.service.spec.ts"

move "src/modules/auth/services/auth.repository.spec.ts" \
     "test/unit/modules/auth/services/auth.repository.spec.ts"

move "src/modules/auth/utils/auth-crypto.util.spec.ts" \
     "test/unit/modules/auth/utils/auth-crypto.util.spec.ts"

move "src/modules/auth/utils/auth-payload.util.spec.ts" \
     "test/unit/modules/auth/utils/auth-payload.util.spec.ts"

echo "== 2. Integration test del módulo =="
move "src/modules/auth/auth.integration.spec.ts" \
     "test/integration/modules/auth/auth.integration.spec.ts"

echo "== 3. Unit tests de common/auth (guards, constants) =="
move "test/common/auth/constants/admin-permissions.constants.spec.ts" \
     "test/unit/common/auth/constants/admin-permissions.constants.spec.ts"

move "test/common/auth/guards/admin-jwt.guard.spec.ts" \
     "test/unit/common/auth/guards/admin-jwt.guard.spec.ts"

move "test/common/auth/guards/require-permissions.guard.spec.ts" \
     "test/unit/common/auth/guards/require-permissions.guard.spec.ts"

echo "== 4. Support: fixtures, mocks y harnesses del módulo auth =="
move "src/modules/auth/__mocks__/auth.fixtures.ts" \
     "test/support/modules/auth/fixtures/auth.fixtures.ts"

move "src/modules/auth/__mocks__/auth.service.mock.ts" \
     "test/support/modules/auth/mocks/auth.service.mock.ts"

move "src/modules/auth/__mocks__/auth.repository.mock.ts" \
     "test/support/modules/auth/mocks/auth.repository.mock.ts"

move "src/modules/auth/__mocks__/jwt.service.mock.ts" \
     "test/support/modules/auth/mocks/jwt.service.mock.ts"

move "src/modules/auth/testing/auth-http-app.ts" \
     "test/support/modules/auth/harnesses/auth-http-app.ts"

move "src/modules/auth/testing/auth-service.test-module.ts" \
     "test/support/modules/auth/harnesses/auth-service.test-module.ts"

move "src/modules/auth/testing/auth.test-types.ts" \
     "test/support/modules/auth/harnesses/auth.test-types.ts"

echo "== 5. Support: mocks de guards de common/auth =="
move "test/common/auth/__mocks__/admin-jwt.guard.mock.ts" \
     "test/support/common/auth/mocks/admin-jwt.guard.mock.ts"

move "test/common/auth/__mocks__/require-permissions.guard.mock.ts" \
     "test/support/common/auth/mocks/require-permissions.guard.mock.ts"

echo "== 6. E2E (ya vivían en test/, solo se confirma la ruta) =="
echo "  test/e2e/auth/auth.e2e-spec.ts          -> sin cambios"
echo "  test/e2e/auth/auth-admin-flows.e2e-spec.ts -> sin cambios"

echo ""
echo "== 7. Limpieza de carpetas vacías en src/ =="
if $DRY_RUN; then
  echo "  [DRY ] find src/modules/auth test/common/auth -type d -empty -delete"
else
  find src/modules/auth test/common/auth -type d -empty -delete 2>/dev/null || true
  echo "  [OK  ] carpetas vacías eliminadas"
fi

echo ""
if $DRY_RUN; then
  echo "DRY-RUN completo. Nada se movió. Corre sin --dry-run para ejecutar."
else
  echo "Migración completa. SIGUIENTE PASO OBLIGATORIO:"
  echo "  1. Actualizar imports dentro de cada .spec.ts movido (ver sección"
  echo "     'Imports y alias de rutas' en el mensaje de Claude)."
  echo "  2. Actualizar jest.config.ts / tsconfig.json (paths + moduleNameMapper)."
  echo "  3. Revisar cada jest.mock('./...') sin factory — probablemente"
  echo "     dependía de la carpeta mágica __mocks__ adyacente al módulo real."
  echo "  4. Correr: npm run test && npm run test:e2e"
fi
