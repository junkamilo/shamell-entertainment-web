/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeAdminAboutRow } from "../test/fixtures/about.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn(() => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/aboutAdminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

import { useAdminAboutForm } from "./useAdminAboutForm";

function makeEvent(): React.FormEvent<HTMLFormElement> {
  return {
    preventDefault: vi.fn(),
  } as unknown as React.FormEvent<HTMLFormElement>;
}

describe("useAdminAboutForm", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("syncs fields from a published record", () => {
    const { result } = renderHook(() =>
      useAdminAboutForm({
        record: null,
        onSaved: vi.fn(async () => undefined),
        closeHeroLightbox: vi.fn(),
      }),
    );

    act(() => {
      result.current.syncFormFromRecord(
        makeAdminAboutRow({
          title: "Synced Title",
          paragraph1: "Body copy",
          coreValues: ["One", "Two"],
        }),
      );
    });

    expect(result.current.title).toBe("Synced Title");
    expect(result.current.paragraph1).toBe("Body copy");
    expect(result.current.coreValuesText).toBe("One\nTwo");
  });

  it("does not PATCH when required fields are empty", async () => {
    let patchCount = 0;
    server.use(
      http.patch("*/api/v1/about/admin", () => {
        patchCount += 1;
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() =>
      useAdminAboutForm({
        record: null,
        onSaved: vi.fn(async () => undefined),
        closeHeroLightbox: vi.fn(),
      }),
    );

    act(() => {
      result.current.setTitle("");
      result.current.setParagraph1("");
      result.current.setCoreValuesText("");
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.onSubmit(makeEvent());
    });

    expect(ok).toBe(false);
    expect(patchCount).toBe(0);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Check the form" }),
    );
  });

  it("PATCHes parsed core values on valid submit", async () => {
    let received: FormData | null = null;
    server.use(
      http.patch("*/api/v1/about/admin", async ({ request }) => {
        received = await request.formData();
        return HttpResponse.json(makeAdminAboutRow());
      }),
    );

    const onSaved = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useAdminAboutForm({
        record: makeAdminAboutRow(),
        onSaved,
        closeHeroLightbox: vi.fn(),
      }),
    );

    act(() => {
      result.current.setTitle("  About  ");
      result.current.setParagraph1("Paragraph");
      result.current.setCoreValuesText("Alpha\n\nBeta");
    });

    let ok = false;
    await act(async () => {
      ok = await result.current.onSubmit(makeEvent());
    });

    expect(ok).toBe(true);
    expect(received!.get("title")).toBe("About");
    expect(received!.get("paragraph1")).toBe("Paragraph");
    expect(received!.getAll("coreValues")).toEqual(["Alpha", "Beta"]);
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });
});
