/**
 * R3F host tags (`mesh`, `group`, `meshStandardMaterial`, …) only work under
 * `@react-three/fiber`'s Canvas reconciler. In jsdom, React DOM treats them as
 * unknown HTML and floods stderr with casing / prop warnings.
 *
 * Map those intrinsics to inert `div` stubs (children only) for smoke mounts.
 * `instancedMesh` also gets a fake Three instancing API so layout effects can run.
 */
import React, { useLayoutEffect, useMemo } from "react";
import { vi } from "vitest";

const R3F_HOST_TAGS = new Set([
  "mesh",
  "object3D",
  "points",
  "line",
  "lineSegments",
  "lineLoop",
  "sprite",
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
  "rectAreaLight",
  "color",
  "fog",
  "fogExp2",
]);

function InstancedMeshDomStub(props: Record<string, unknown>) {
  const fake = useMemo(
    () => ({
      setMatrixAt: () => undefined,
      instanceMatrix: { needsUpdate: false },
    }),
    [],
  );
  const ref = props.ref as
    | { current: unknown }
    | ((value: unknown) => void)
    | undefined;
  useLayoutEffect(() => {
    if (typeof ref === "function") ref(fake);
    else if (ref && typeof ref === "object") ref.current = fake;
    return () => {
      if (typeof ref === "function") ref(null);
      else if (ref && typeof ref === "object") ref.current = null;
    };
  }, [fake, ref]);
  return React.createElement(
    "div",
    { "data-r3f": "instancedMesh" },
    props.children as React.ReactNode,
  );
}

function Object3DDomStub({
  hostTag,
  props,
}: {
  hostTag: string;
  props: Record<string, unknown> | null | undefined;
}) {
  const fake = useMemo(
    () => ({
      scale: { set: () => undefined },
      target: null as unknown,
    }),
    [],
  );
  const ref = props?.ref as
    | { current: unknown }
    | ((value: unknown) => void)
    | undefined;
  useLayoutEffect(() => {
    if (typeof ref === "function") ref(fake);
    else if (ref && typeof ref === "object") ref.current = fake;
    return () => {
      if (typeof ref === "function") ref(null);
      else if (ref && typeof ref === "object") ref.current = null;
    };
  }, [fake, ref]);
  return React.createElement("div", stubProps(hostTag, props), props?.children as React.ReactNode);
}

function stubProps(hostTag: string, props: Record<string, unknown> | null | undefined) {
  const forwarded: Record<string, unknown> = {};
  if (props) {
    for (const key of [
      "onClick",
      "onPointerDown",
      "onPointerUp",
      "onPointerMove",
      "onPointerOut",
      "onPointerOver",
      "onPointerMissed",
      "onContextMenu",
    ]) {
      if (key in props) forwarded[key] = props[key];
    }
  }
  return {
    "data-r3f": hostTag,
    ...forwarded,
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
      if (type === "instancedMesh") {
        return jsx(InstancedMeshDomStub, props, key);
      }
      if (type === "group" || type === "spotLight") {
        return jsx(Object3DDomStub, { hostTag: type, props }, key);
      }
      if (typeof type === "string" && R3F_HOST_TAGS.has(type)) {
        return jsx("div", stubProps(type, props as Record<string, unknown>), key);
      }
      return jsx(type, props, key);
    },
    jsxs(type: unknown, props: unknown, key?: unknown) {
      if (type === "instancedMesh") {
        return jsxs(InstancedMeshDomStub, props, key);
      }
      if (type === "group" || type === "spotLight") {
        return jsxs(Object3DDomStub, { hostTag: type, props }, key);
      }
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
            if (type === "instancedMesh") {
              return jsxDEV(InstancedMeshDomStub, props, key, isStatic, source, self);
            }
            if (type === "group" || type === "spotLight") {
              return jsxDEV(
                Object3DDomStub,
                { hostTag: type, props },
                key,
                isStatic,
                source,
                self,
              );
            }
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
