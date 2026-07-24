/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useState, useCallback } from "react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeCatalogSnapshot,
  makeContactLine,
  makePublicServiceOption,
} from "../test/fixtures/contacto.fixture";
import {
  FIXTURE_CATALOG_ID,
  FIXTURE_CONTACT_LINE_ID,
  FIXTURE_SERVICE_ID,
} from "../test/fixtures/uuids.fixture";
import { contactLinesListHandler } from "../test/mocks/handlers";
import { emptyWizard, phaseFlow } from "../lib/inquiry/wizardValidation";
import type { WizardStateApi } from "./useContactInquiryWizard";
import { useContactInquiryCatalog } from "./useContactInquiryCatalog";

const replace = vi.fn();
let params = new URLSearchParams("mode=booking");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/contacto",
  useSearchParams: () => ({
    get: (key: string) => params.get(key),
    toString: () => params.toString(),
  }),
}));

function useCatalogHarness(
  args: Omit<Parameters<typeof useContactInquiryCatalog>[0], "wizardState"> = {},
) {
  const [data, setData] = useState(emptyWizard("GENERAL"));
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const resetWizard = useCallback(() => {
    setData(emptyWizard());
    setPhaseIndex(0);
    setStepError(null);
  }, []);

  const wizardState: WizardStateApi = {
    data,
    setData,
    phaseIndex,
    setPhaseIndex,
    stepError,
    setStepError,
    resetWizard,
  };

  const catalog = useContactInquiryCatalog({
    hadEventIdInUrl: false,
    hadServiceTypeInUrl: false,
    wizardState,
    ...args,
  });

  return { catalog, wizardState };
}

describe("useContactInquiryCatalog", () => {
  beforeEach(() => {
    replace.mockClear();
    params = new URLSearchParams("mode=booking");
    server.use(
      contactLinesListHandler(),
      http.get("*/api/v1/services", () =>
        HttpResponse.json([
          {
            id: FIXTURE_SERVICE_ID,
            serviceTypeName: "Performance",
            contactInquiryCode: "GENERAL",
            description: "Private show package.",
            items: ["Dance set"],
            imageUrl: "https://cdn.example.com/service.jpg",
            price: 1500,
          },
        ]),
      ),
    );
  });

  it("loads contact lines and service options", async () => {
    const { result } = renderHook(() => useCatalogHarness());

    await waitFor(() => expect(result.current.catalog.linesLoading).toBe(false));
    expect(result.current.catalog.contactLines[0]?.id).toBe(FIXTURE_CONTACT_LINE_ID);
    expect(result.current.catalog.serviceTypeOptions[0]?.id).toBe(FIXTURE_SERVICE_ID);
  });

  it("sets linesError when contact-lines fetch fails", async () => {
    server.use(
      http.get("*/api/v1/events/contact-lines", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCatalogHarness());
    await waitFor(() => expect(result.current.catalog.linesLoading).toBe(false));

    expect(result.current.catalog.contactLines).toEqual([]);
    expect(result.current.catalog.linesError).toMatch(/could not load offerings/i);
  });

  it("prefills wizard from initialEventId and jumps to detail", async () => {
    const { result } = renderHook(() =>
      useCatalogHarness({
        initialEventId: FIXTURE_CONTACT_LINE_ID,
        hadEventIdInUrl: true,
      }),
    );

    await waitFor(() => expect(result.current.catalog.linesLoading).toBe(false));
    await waitFor(() =>
      expect(result.current.wizardState.data.contactLineId).toBe(FIXTURE_CONTACT_LINE_ID),
    );

    const detailIdx = phaseFlow("").indexOf("detail");
    expect(result.current.wizardState.phaseIndex).toBe(detailIdx);
  });

  it("loads catalog snapshot for initialCatalog", async () => {
    const { result } = renderHook(() =>
      useCatalogHarness({
        initialCatalog: { kind: "event", id: FIXTURE_CATALOG_ID },
      }),
    );

    await waitFor(() => expect(result.current.catalog.catalogLoading).toBe(false));
    expect(result.current.catalog.catalogSnapshot).toMatchObject({
      id: FIXTURE_CATALOG_ID,
      title: "Gala Night",
    });
  });

  it("dismissCatalogContext clears snapshot and resets wizard", async () => {
    const { result } = renderHook(() =>
      useCatalogHarness({
        initialCatalog: { kind: "service", id: FIXTURE_SERVICE_ID },
      }),
    );

    await waitFor(() => expect(result.current.catalog.catalogLoading).toBe(false));
    expect(result.current.catalog.catalogSnapshot).not.toBeNull();

    act(() => {
      result.current.catalog.dismissCatalogContext();
    });

    expect(result.current.catalog.catalogSnapshot).toBeNull();
    expect(replace).toHaveBeenCalled();
    expect(result.current.wizardState.data.contactLineId).toBe("");
    expect(result.current.wizardState.phaseIndex).toBe(0);
  });

  it("handles catalog 404 with friendly error", async () => {
    server.use(
      http.get("*/api/v1/events/catalog/:id", () =>
        HttpResponse.json({ message: "missing" }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() =>
      useCatalogHarness({
        initialCatalog: { kind: "event", id: FIXTURE_CATALOG_ID },
      }),
    );

    await waitFor(() => expect(result.current.catalog.catalogLoading).toBe(false));
    expect(result.current.catalog.catalogSnapshot).toBeNull();
    expect(result.current.catalog.catalogFetchError).toMatch(/no longer available/i);
  });

  it("auto-selects single occasion option", async () => {
    server.use(
      contactLinesListHandler([
        makeContactLine({
          occasionSingle: [{ id: "oc111111-1111-4111-8111-111111111111", name: "Wedding" }],
        }),
      ]),
    );

    const { result } = renderHook(() =>
      useCatalogHarness({
        initialEventId: FIXTURE_CONTACT_LINE_ID,
        hadEventIdInUrl: true,
      }),
    );

    await waitFor(() =>
      expect(result.current.wizardState.data.occasionTypeId).toBe(
        "oc111111-1111-4111-8111-111111111111",
      ),
    );
  });

  it("maps service summary from catalog service snapshot", async () => {
    server.use(
      http.get("*/api/v1/services/catalog/:id", () =>
        HttpResponse.json(
          makeCatalogSnapshot({
            kind: "service",
            id: FIXTURE_SERVICE_ID,
            title: "Performance",
            contactInquiryCode: "GENERAL",
          }),
        ),
      ),
    );

    const { result } = renderHook(() =>
      useCatalogHarness({
        initialCatalog: { kind: "service", id: FIXTURE_SERVICE_ID },
      }),
    );

    await waitFor(() => expect(result.current.catalog.catalogLoading).toBe(false));

    act(() => {
      result.current.wizardState.setData((prev) => ({ ...prev, inquiryCode: "GENERAL" }));
    });

    await waitFor(() =>
      expect(result.current.catalog.serviceSummary?.title).toBe("Performance"),
    );
    expect(result.current.catalog.serviceSummaryLoading).toBe(false);
  });

  it("loads public service summary by inquiry code", async () => {
    server.use(
      http.get("*/api/v1/services/public/by-inquiry/:code", () =>
        HttpResponse.json(makePublicServiceOption({ title: "VIP Package", inquiryCode: "VIP_EVENT" })),
      ),
    );

    const { result } = renderHook(() => useCatalogHarness());

    act(() => {
      result.current.wizardState.setData((prev) => ({ ...prev, inquiryCode: "VIP_EVENT" }));
    });

    await waitFor(() =>
      expect(result.current.catalog.serviceSummary?.title).toBe("VIP Package"),
    );
  });
});
