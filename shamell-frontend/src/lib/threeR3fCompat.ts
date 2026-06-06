/**
 * React Three Fiber v9 still uses THREE.Clock (deprecated since r183). Clock is a
 * read-only export on the THREE namespace, so we filter known harmless warnings via
 * Three.js setConsoleFunction until R3F v10 migrates to Timer.
 */
import { setConsoleFunction } from "three";

const PATCH_KEY = "__shamellThreeConsoleFilterInstalled";

function shouldSuppressThreeWarn(message: string, params: unknown[]): boolean {
  if (message.includes("Clock") && message.includes("deprecated")) {
    return true;
  }
  if (message.includes("WebGLProgram") && message.includes("Program Info Log")) {
    return true;
  }
  const joined = params
    .filter((p): p is string => typeof p === "string")
    .join(" ");
  if (joined.includes("warning X4122")) {
    return true;
  }
  return false;
}

function installThreeConsoleFilter() {
  const g = globalThis as typeof globalThis & { [PATCH_KEY]?: boolean };
  if (g[PATCH_KEY]) return;

  setConsoleFunction((type, message, ...params) => {
    if (type === "warn" && shouldSuppressThreeWarn(message, params)) {
      return;
    }
    if (type === "error") {
      console.error(message, ...params);
      return;
    }
    if (type === "warn") {
      console.warn(message, ...params);
      return;
    }
    console.log(message, ...params);
  });

  g[PATCH_KEY] = true;
}

installThreeConsoleFilter();
