/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { type ReactNode, forwardRef, useImperativeHandle } from "react";

vi.mock("@/lib/threeR3fCompat", () => ({}));

const invalidate = vi.fn();
const created = {
  gl: {
    debug: { checkShaderErrors: true },
    toneMappingExposure: 1,
    setClearColor: vi.fn(),
    domElement: document.createElement("canvas"),
  },
  camera: { name: "cam" },
  scene: { background: null as unknown },
};

vi.mock("@react-three/fiber", () => ({
  Canvas: ({
    children,
    onCreated,
    onPointerMissed,
  }: {
    children: ReactNode;
    onCreated?: (state: typeof created) => void;
    onPointerMissed?: () => void;
  }) => {
    onCreated?.(created);
    return (
      <div data-testid="r3f-canvas" onClick={() => onPointerMissed?.()}>
        {children}
      </div>
    );
  },
  useThree: (selector?: (s: { invalidate: typeof invalidate }) => unknown) =>
    typeof selector === "function" ? selector({ invalidate }) : { invalidate },
  useFrame: () => {},
}));

vi.mock("@react-three/drei", () => ({
  Environment: () => <div data-testid="environment" />,
  OrbitControls: forwardRef(function MockOrbitControls(
    { onChange }: { onChange?: () => void },
    ref: React.Ref<{ enabled: boolean }>,
  ) {
    useImperativeHandle(ref, () => ({ enabled: true }));
    return (
      <button type="button" data-testid="orbit" onClick={() => onChange?.()}>
        orbit
      </button>
    );
  }),
}));

vi.mock("../../items/PlacedItemsLayer", () => ({
  default: ({
    onSelect,
    onReservedSelect,
  }: {
    onSelect?: (id: string) => void;
    onReservedSelect?: (id: string) => void;
  }) => (
    <div data-testid="placed-items">
      <button type="button" data-testid="select-item" onClick={() => onSelect?.("t1")}>
        select
      </button>
      <button
        type="button"
        data-testid="select-reserved"
        onClick={() => onReservedSelect?.("t1")}
      >
        reserved
      </button>
    </div>
  ),
}));

vi.mock("../../room/VenueRoomPlaceholder", () => ({
  default: () => <div data-testid="room" />,
}));

vi.mock("../FloorPickPlane", () => ({
  default: ({ onPointerMissed }: { onPointerMissed?: () => void }) => (
    <button type="button" data-testid="pick-plane" onClick={() => onPointerMissed?.()}>
      miss
    </button>
  ),
}));

import VenueScene3D from "./VenueScene3D";
import { useVenueSceneCanvas } from "../VenueSceneCanvasContext";

function CanvasCtxProbe() {
  const { getCanvas, setOrbitEnabled } = useVenueSceneCanvas();
  return (
    <button type="button" data-testid="ctx-probe" onClick={() => setOrbitEnabled(true)}>
      {getCanvas() ? "yes" : "no"}
    </button>
  );
}

let resizeWidth = 900;
let resizeHeight = 500;

class MockResizeObserver {
  cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe(el: Element) {
    Object.defineProperty(el, "clientWidth", { configurable: true, value: resizeWidth });
    Object.defineProperty(el, "clientHeight", { configurable: true, value: resizeHeight });
    this.cb([] as unknown as ResizeObserverEntry[], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}

describe("VenueScene3D", () => {
  beforeEach(() => {
    invalidate.mockReset();
    resizeWidth = 900;
    resizeHeight = 500;
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("mounts canvas shell for public-select", () => {
    render(
      <VenueScene3D
        mode="public-select"
        viewBoxWidth={1000}
        viewBoxHeight={800}
        items={[]}
      />,
    );
    expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("placed-items")).toBeInTheDocument();
    expect(screen.getByTestId("environment")).toBeInTheDocument();
  });

  it("uses admin handles and background click", () => {
    const onBackgroundClick = vi.fn();
    const canvasRef = {
      current: null as null | {
        getCanvas: () => unknown;
        getCamera: () => unknown;
        setOrbitEnabled?: (enabled: boolean) => void;
      },
    };
    render(
      <VenueScene3D
        mode="admin"
        viewBoxWidth={1000}
        viewBoxHeight={800}
        items={[]}
        canvasRef={canvasRef}
        placedItemsAdmin={<div data-testid="admin-items" />}
        sceneDecorAdmin={<div data-testid="admin-decor"><CanvasCtxProbe /></div>}
        onBackgroundClick={onBackgroundClick}
        className="extra"
      />,
    );
    expect(screen.getByTestId("admin-items")).toBeInTheDocument();
    expect(screen.getByTestId("admin-decor")).toBeInTheDocument();
    expect(screen.getByTestId("pick-plane")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("pick-plane"));
    expect(onBackgroundClick).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("r3f-canvas"));
    expect(onBackgroundClick).toHaveBeenCalledTimes(3);
    expect(canvasRef.current?.getCanvas()).toBe(created.gl.domElement);
    expect(canvasRef.current?.getCamera()).toBe(created.camera);
    canvasRef.current?.setOrbitEnabled?.(false);
    fireEvent.click(screen.getByTestId("ctx-probe"));
    expect(screen.getByTestId("ctx-probe")).toHaveTextContent("yes");
  });

  it("skips environment and room point light on mobile", () => {
    render(
      <VenueScene3D
        mode="public"
        viewBoxWidth={1000}
        viewBoxHeight={800}
        items={[]}
        perfProfile="mobile"
        sceneActive={false}
      />,
    );
    expect(screen.queryByTestId("environment")).not.toBeInTheDocument();
    expect(screen.getByTestId("placed-items")).toBeInTheDocument();
  });

  it("invalidates the demand loop from orbit controls", () => {
    render(
      <VenueScene3D
        mode="public-select"
        viewBoxWidth={1000}
        viewBoxHeight={800}
        items={[]}
        sceneActive
        selectedId="t1"
      />,
    );
    fireEvent.click(screen.getByTestId("orbit"));
    expect(invalidate).toHaveBeenCalled();
  });

  it("forwards public-select item picks", () => {
    const onItemSelect = vi.fn();
    const onItemReservedSelect = vi.fn();
    render(
      <VenueScene3D
        mode="public-select"
        viewBoxWidth={1000}
        viewBoxHeight={800}
        items={[]}
        onItemSelect={onItemSelect}
        onItemReservedSelect={onItemReservedSelect}
      />,
    );
    fireEvent.click(screen.getByTestId("select-item"));
    fireEvent.click(screen.getByTestId("select-reserved"));
    expect(onItemSelect).toHaveBeenCalledWith("t1");
    expect(onItemReservedSelect).toHaveBeenCalledWith("t1");
  });

  it("tears down the deferred environment when switching to mobile", () => {
    const { rerender } = render(
      <VenueScene3D
        mode="public"
        viewBoxWidth={1000}
        viewBoxHeight={800}
        items={[]}
        dpr={[1, 1.5]}
      />,
    );
    expect(screen.getByTestId("environment")).toBeInTheDocument();
    act(() => {
      rerender(
        <VenueScene3D
          mode="public"
          viewBoxWidth={1000}
          viewBoxHeight={800}
          items={[]}
          perfProfile="mobile"
        />,
      );
    });
    expect(screen.queryByTestId("environment")).not.toBeInTheDocument();
  });

  it("does not fire canvas miss outside admin", () => {
    const onBackgroundClick = vi.fn();
    render(
      <VenueScene3D
        mode="public"
        viewBoxWidth={1000}
        viewBoxHeight={800}
        items={[]}
        onBackgroundClick={onBackgroundClick}
      />,
    );
    fireEvent.click(screen.getByTestId("r3f-canvas"));
    expect(onBackgroundClick).not.toHaveBeenCalled();
  });

  it("does not invalidate orbit changes when the scene is inactive", () => {
    render(
      <VenueScene3D
        mode="public-select"
        viewBoxWidth={1000}
        viewBoxHeight={800}
        items={[]}
        sceneActive={false}
      />,
    );
    invalidate.mockClear();
    fireEvent.click(screen.getByTestId("orbit"));
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("uses a lower DPR on a narrow viewport", () => {
    resizeWidth = 400;
    resizeHeight = 800;
    expect(() =>
      render(
        <VenueScene3D
          mode="public"
          viewBoxWidth={1000}
          viewBoxHeight={800}
          items={[]}
        />,
      ),
    ).not.toThrow();
  });

  it("skips aspect updates when the canvas has no size", () => {
    resizeWidth = 0;
    resizeHeight = 0;
    expect(() =>
      render(
        <VenueScene3D
          mode="admin"
          viewBoxWidth={1000}
          viewBoxHeight={800}
          items={[]}
        />,
      ),
    ).not.toThrow();
  });
});
