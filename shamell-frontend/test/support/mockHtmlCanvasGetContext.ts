/**
 * jsdom does not implement canvas.getContext. Stage backdrop signage (and similar)
 * call getContext("2d") during mount; stub a minimal 2D context so smoke tests
 * do not print "Not implemented: HTMLCanvasElement's getContext()".
 */
function createMock2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const noop = () => {};
  return {
    canvas,
    clearRect: noop,
    fillRect: noop,
    strokeRect: noop,
    fillText: noop,
    strokeText: noop,
    measureText: () => ({ width: 0 }) as TextMetrics,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    fill: noop,
    save: noop,
    restore: noop,
    translate: noop,
    scale: noop,
    rotate: noop,
    drawImage: noop,
    clip: noop,
    setTransform: noop,
    resetTransform: noop,
    transform: noop,
    getImageData: () =>
      ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
        colorSpace: "srgb",
      }) as ImageData,
    putImageData: noop,
    createImageData: () =>
      ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
        colorSpace: "srgb",
      }) as ImageData,
    createLinearGradient: () => ({ addColorStop: noop }) as CanvasGradient,
    createRadialGradient: () => ({ addColorStop: noop }) as CanvasGradient,
    createPattern: () => null,
    fillStyle: "#000",
    strokeStyle: "#000",
    font: "10px sans-serif",
    textAlign: "start",
    textBaseline: "alphabetic",
    shadowColor: "transparent",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    globalAlpha: 1,
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

export function installHtmlCanvasGetContextMock() {
  if (typeof HTMLCanvasElement === "undefined") return;
  const proto = HTMLCanvasElement.prototype;
  if ((proto as { __shamellGetContextMocked?: boolean }).__shamellGetContextMocked) {
    return;
  }

  proto.getContext = function (
    this: HTMLCanvasElement,
    contextId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: unknown,
  ): RenderingContext | null {
    if (contextId === "2d") {
      return createMock2dContext(this);
    }
    return null;
  } as typeof HTMLCanvasElement.prototype.getContext;

  (proto as { __shamellGetContextMocked?: boolean }).__shamellGetContextMocked = true;
}

installHtmlCanvasGetContextMock();
