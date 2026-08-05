import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setConsoleFunctionMock = vi.hoisted(() => vi.fn());

vi.mock("three", () => ({
  setConsoleFunction: setConsoleFunctionMock,
}));

type ThreeConsoleFn = (
  type: "log" | "warn" | "error",
  message: string,
  ...params: unknown[]
) => void;

const PATCH_KEY = "__shamellThreeConsoleFilterInstalled";

describe("threeR3fCompat", () => {
  beforeEach(() => {
    vi.resetModules();
    setConsoleFunctionMock.mockClear();
    delete (globalThis as typeof globalThis & { [PATCH_KEY]?: boolean })[
      PATCH_KEY
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as typeof globalThis & { [PATCH_KEY]?: boolean })[
      PATCH_KEY
    ];
  });

  async function loadFilter(): Promise<ThreeConsoleFn> {
    await import("./threeR3fCompat");
    expect(setConsoleFunctionMock).toHaveBeenCalledTimes(1);
    return setConsoleFunctionMock.mock.calls[0]![0] as ThreeConsoleFn;
  }

  it("installs the Three console filter once per process", async () => {
    await import("./threeR3fCompat");
    expect(setConsoleFunctionMock).toHaveBeenCalledTimes(1);

    // Module reload with the patch flag still set must not reinstall.
    setConsoleFunctionMock.mockClear();
    vi.resetModules();
    await import("./threeR3fCompat");
    expect(setConsoleFunctionMock).not.toHaveBeenCalled();
  });

  it("suppresses known Clock deprecation warnings", async () => {
    const filter = await loadFilter();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    filter("warn", "THREE.Clock is deprecated since r183");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("suppresses WebGLProgram Info Log warnings", async () => {
    const filter = await loadFilter();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    filter("warn", "WebGLProgram: Program Info Log: unused varying");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("suppresses warning X4122 in params", async () => {
    const filter = await loadFilter();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    filter("warn", "shader compile", "warning X4122: something");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("forwards other warns, errors, and logs", async () => {
    const filter = await loadFilter();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    filter("warn", "unrelated warning", "extra");
    expect(warnSpy).toHaveBeenCalledWith("unrelated warning", "extra");

    filter("error", "boom", 1);
    expect(errorSpy).toHaveBeenCalledWith("boom", 1);

    filter("log", "hello");
    expect(logSpy).toHaveBeenCalledWith("hello");
  });
});
