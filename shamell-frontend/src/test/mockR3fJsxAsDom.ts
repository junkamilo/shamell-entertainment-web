/**
 * R3F host tags (`mesh`, `group`, `meshStandardMaterial`, …) only work under
 * `@react-three/fiber`'s Canvas reconciler. In jsdom, React DOM treats them as
 * unknown HTML and floods stderr with casing / prop warnings.
 *
 * Map those intrinsics to inert `div` stubs (children only) for smoke mounts.
 */
import { vi } from "vitest";

const R3F_HOST_TAGS = new Set([
  "mesh",
  "group",
  "object3D",
  "points",
  "line",
  "lineSegments",
  "lineLoop",
  "sprite",
  "instancedMesh",
  "batchedMesh",
  "skinnedMesh",
  "primitive",
  "planeGeometry",
  "boxGeometry",
  "circleGeometry",
  "cylinderGeometry",
  "coneGeometry",
  "sphereGeometry",
  "torusGeometry",
  "torusKnotGeometry",
  "ringGeometry",
  "bufferGeometry",
  "extrudeGeometry",
  "latheGeometry",
  "shapeGeometry",
  "tubeGeometry",
  "polyhedronGeometry",
  "dodecahedronGeometry",
  "icosahedronGeometry",
  "octahedronGeometry",
  "tetrahedronGeometry",
  "edgesGeometry",
  "wireframeGeometry",
  "meshStandardMaterial",
  "meshBasicMaterial",
  "meshPhysicalMaterial",
  "meshLambertMaterial",
  "meshPhongMaterial",
  "meshToonMaterial",
  "meshNormalMaterial",
  "meshDepthMaterial",
  "meshMatcapMaterial",
  "pointsMaterial",
  "lineBasicMaterial",
  "lineDashedMaterial",
  "shadowMaterial",
  "spriteMaterial",
  "shaderMaterial",
  "rawShaderMaterial",
  "ambientLight",
  "directionalLight",
  "hemisphereLight",
  "pointLight",
  "spotLight",
  "rectAreaLight",
  "color",
  "fog",
  "fogExp2",
]);

function stubProps(hostTag: string, props: Record<string, unknown> | null | undefined) {
  return {
    "data-r3f": hostTag,
    children: props?.children,
  };
}

function patchJsxRuntime<T extends Record<string, unknown>>(mod: T): T {
  const jsx = mod.jsx as (type: unknown, props: unknown, key?: unknown) => unknown;
  const jsxs = mod.jsxs as (type: unknown, props: unknown, key?: unknown) => unknown;
  const jsxDEV = mod.jsxDEV as
    | ((
        type: unknown,
        props: unknown,
        key: unknown,
        isStatic: boolean,
        source: unknown,
        self: unknown,
      ) => unknown)
    | undefined;

  return {
    ...mod,
    jsx(type: unknown, props: unknown, key?: unknown) {
      if (typeof type === "string" && R3F_HOST_TAGS.has(type)) {
        return jsx("div", stubProps(type, props as Record<string, unknown>), key);
      }
      return jsx(type, props, key);
    },
    jsxs(type: unknown, props: unknown, key?: unknown) {
      if (typeof type === "string" && R3F_HOST_TAGS.has(type)) {
        return jsxs("div", stubProps(type, props as Record<string, unknown>), key);
      }
      return jsxs(type, props, key);
    },
    ...(typeof jsxDEV === "function"
      ? {
          jsxDEV(
            type: unknown,
            props: unknown,
            key: unknown,
            isStatic: boolean,
            source: unknown,
            self: unknown,
          ) {
            if (typeof type === "string" && R3F_HOST_TAGS.has(type)) {
              return jsxDEV(
                "div",
                stubProps(type, props as Record<string, unknown>),
                key,
                isStatic,
                source,
                self,
              );
            }
            return jsxDEV(type, props, key, isStatic, source, self);
          },
        }
      : {}),
  };
}

vi.mock("react/jsx-runtime", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react/jsx-runtime")>();
  return patchJsxRuntime(mod as Record<string, unknown>);
});

vi.mock("react/jsx-dev-runtime", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react/jsx-dev-runtime")>();
  return patchJsxRuntime(mod as Record<string, unknown>);
});
