/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { FormEvent } from "react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeAdminEvent,
  makeEventTypeOption,
} from "../test/fixtures/events.fixture";
import {
  FIXTURE_CATALOG_IMAGE_ID,
  FIXTURE_EVENT_ID,
  FIXTURE_EVENT_ID_2,
} from "../test/fixtures/uuids.fixture";
import {
  emptyScheduleForm,
  type ScheduleFormState,
} from "@/features/admin/on-coming-events/reservation-events/components/ReservationEventScheduleSections";
import { defaultReservationWeekdays } from "@/features/admin/on-coming-events/reservation-events/lib/reservationEventTemplateDefaults";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const pathnameRef = vi.hoisted(() => ({ current: "/admin/events" }));

const postAdminEventMock = vi.fn();
const patchAdminEventMock = vi.fn();
const patchAdminEventActiveMock = vi.fn();
const deleteAdminEventMock = vi.fn();
const postCatalogImagesMock = vi.fn();
const deleteGalleryPhotoMock = vi.fn();
const fetchVenueConfigMock = vi.fn();
const patchVenueConfigMock = vi.fn();
const regenerateSessionsMock = vi.fn();
const fetchTemplatesMock = vi.fn();
const createTemplateMock = vi.fn();
const patchTemplateMock = vi.fn();
const fetchEventActivitiesMock = vi.fn();
const createFixedEventPackageMock = vi.fn();
const persistEventActivitiesMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameRef.current,
}));

vi.mock("../lib/eventsAuth", () => ({
  getEventsBearerToken: () => getTokenMock(),
}));

vi.mock("../services/postAdminEvent", () => ({
  postAdminEvent: (...args: unknown[]) => postAdminEventMock(...args),
}));
vi.mock("../services/patchAdminEvent", () => ({
  patchAdminEvent: (...args: unknown[]) => patchAdminEventMock(...args),
  patchAdminEventActive: (...args: unknown[]) => patchAdminEventActiveMock(...args),
}));
vi.mock("../services/deleteAdminEvent", () => ({
  deleteAdminEvent: (...args: unknown[]) => deleteAdminEventMock(...args),
}));
vi.mock("../services/postAdminEventCatalogImages", () => ({
  postAdminEventCatalogImages: (...args: unknown[]) => postCatalogImagesMock(...args),
}));
vi.mock("../services/deleteGalleryAdminPhoto", () => ({
  deleteGalleryAdminPhoto: (...args: unknown[]) => deleteGalleryPhotoMock(...args),
}));
vi.mock("@/features/admin/on-coming-events/services/patchAdminVenueConfig", () => ({
  fetchAdminVenueConfig: (...args: unknown[]) => fetchVenueConfigMock(...args),
  patchAdminVenueConfig: (...args: unknown[]) => patchVenueConfigMock(...args),
}));
vi.mock("@/features/admin/on-coming-events/services/postAdminRegenerateClassSessions", () => ({
  postAdminRegenerateClassSessions: (...args: unknown[]) => regenerateSessionsMock(...args),
}));
vi.mock(
  "@/features/admin/on-coming-events/reservation-events/services/fetchAdminReservationEventTemplates",
  () => ({
    fetchAdminReservationEventTemplates: (...args: unknown[]) => fetchTemplatesMock(...args),
  }),
);
vi.mock(
  "@/features/admin/on-coming-events/reservation-events/services/createAdminReservationEventTemplate",
  () => ({
    createAdminReservationEventTemplate: (...args: unknown[]) => createTemplateMock(...args),
  }),
);
vi.mock(
  "@/features/admin/on-coming-events/reservation-events/services/patchAdminReservationEventTemplate",
  () => ({
    patchAdminReservationEventTemplate: (...args: unknown[]) => patchTemplateMock(...args),
  }),
);
vi.mock(
  "@/features/admin/on-coming-events/fixed-packages/services/fixedEventPackagesApi",
  () => ({
    fetchEventActivities: (...args: unknown[]) => fetchEventActivitiesMock(...args),
    createFixedEventPackage: (...args: unknown[]) => createFixedEventPackageMock(...args),
  }),
);
vi.mock(
  "@/features/admin/on-coming-events/fixed-packages/services/persistEventActivities",
  () => ({
    persistEventActivities: (...args: unknown[]) => persistEventActivitiesMock(...args),
  }),
);
vi.mock("@/lib/on-coming-events/onComingEventsSettingsEvents", () => ({
  notifyOnComingEventsPublicDataChanged: vi.fn(),
}));

import { useEventsPage } from "./useEventsPage";

function fakeSubmitEvent() {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
}

function asFileList(files: File[]): FileList {
  return {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    *[Symbol.iterator]() {
      yield* files;
    },
  } as FileList;
}

function fixedScheduleForm(): ScheduleFormState {
  return {
    ...emptyScheduleForm(),
    scheduleMode: "FIXED_EVENT",
    salesStartDate: "2030-07-01",
    salesEndDate: "2030-07-31",
    eventDate: "2030-08-01",
    eventStartTime: "20:00",
    eventEndTime: "23:00",
  };
}

function recurringScheduleForm(): ScheduleFormState {
  return {
    ...emptyScheduleForm(),
    scheduleMode: "RECURRING_WEEKLY",
    weekdays: defaultReservationWeekdays().map((w) =>
      w.weekday === 1 ? { ...w, isActive: true } : { ...w, isActive: false },
    ),
    classSections: [
      {
        weekday: 1,
        label: "Beginner",
        startTime: "19:00",
        endTime: "20:00",
        sortOrder: 0,
        defaultCapacity: "20",
        defaultPrice: "25",
      },
    ],
  };
}

function fillValidGeneralForm(result: { current: ReturnType<typeof useEventsPage> }) {
  act(() => {
    result.current.form.setDescription("Long enough description");
    result.current.form.setItemsText("Dance set");
    result.current.form.setPriceInput("1500");
  });
}

describe("useEventsPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    pathnameRef.current = "/admin/events";
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    postAdminEventMock.mockReset().mockResolvedValue({ id: "new-event-id" });
    patchAdminEventMock.mockReset().mockResolvedValue({ ok: true });
    patchAdminEventActiveMock.mockReset().mockResolvedValue({ ok: true });
    deleteAdminEventMock.mockReset().mockResolvedValue({ ok: true });
    postCatalogImagesMock.mockReset().mockResolvedValue({ ok: true });
    deleteGalleryPhotoMock.mockReset().mockResolvedValue({ ok: true });
    fetchVenueConfigMock.mockReset().mockResolvedValue({
      ok: true,
      config: null,
    });
    patchVenueConfigMock.mockReset().mockResolvedValue({ ok: true, config: {} });
    regenerateSessionsMock.mockReset().mockResolvedValue({ ok: true });
    fetchTemplatesMock.mockReset().mockResolvedValue({ ok: true, templates: [] });
    createTemplateMock.mockReset().mockResolvedValue({
      ok: true,
      template: { id: "tmpl-1" },
    });
    patchTemplateMock.mockReset().mockResolvedValue({
      ok: true,
      template: { id: "tmpl-1" },
    });
    fetchEventActivitiesMock.mockReset().mockResolvedValue({
      ok: true,
      activities: [],
    });
    createFixedEventPackageMock.mockReset().mockResolvedValue({
      ok: true,
      pkg: { id: "pkg-1" },
    });
    persistEventActivitiesMock.mockReset().mockImplementation(
      async (_token: string, _eventId: string, next: Array<{ clientKey?: string; title: string }>) => ({
        ok: true,
        activities: next.map((a, i) => ({
          id: `act-${i + 1}`,
          clientKey: a.clientKey,
          title: a.title,
          description: "Desc",
          accentColor: "",
          showText: true,
          displayOrder: i,
          mediaUrl: null,
          mediaType: null,
          pendingMediaFile: null,
        })),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads catalog events after mount", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    expect(result.current.catalog.events.length).toBeGreaterThan(0);
    expect(result.current.pageTitle).toBe("Events");
    expect(result.current.upcomingOnly).toBe(false);
    expect(result.current.embedded).toBe(false);
  });

  it("uses upcoming titles when upcomingOnly or on-coming pathname", async () => {
    pathnameRef.current = "/admin/on-coming-events";
    const { result, rerender } = renderHook(
      (props: { upcomingOnly?: boolean; embedded?: boolean }) => useEventsPage(props),
      { initialProps: {} },
    );
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    expect(result.current.pageTitle).toBe("Upcoming Events");
    expect(result.current.createLabel).toBe("New upcoming event");
    expect(result.current.upcomingOnly).toBe(true);

    pathnameRef.current = "/admin/upcoming-events";
    rerender({});
    expect(result.current.upcomingOnly).toBe(true);

    pathnameRef.current = "/shamell-admin/on-coming-events";
    rerender({});
    expect(result.current.upcomingOnly).toBe(true);

    pathnameRef.current = "/shamell-admin/upcoming-events";
    rerender({});
    expect(result.current.upcomingOnly).toBe(true);

    pathnameRef.current = "/admin/events";
    rerender({ upcomingOnly: true, embedded: true });
    expect(result.current.upcomingOnly).toBe(true);
    expect(result.current.embedded).toBe(true);
  });

  it("seeds event type from inactive-only list and keeps current on reload", async () => {
    server.use(
      http.get("*/api/v1/events/types/admin", () =>
        HttpResponse.json([
          makeEventTypeOption({ id: "type-inactive", isActive: false, name: "Legacy" }),
        ]),
      ),
    );
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    expect(result.current.eventTypeId).toBe("type-inactive");
    await act(async () => {
      await result.current.catalog.loadAllData();
    });
    expect(result.current.eventTypeId).toBe("type-inactive");
  });

  it("openCreateModal and closeModal; close blocked while submitting", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));

    act(() => result.current.openCreateModal());
    expect(result.current.isModalOpen).toBe(true);

    act(() => result.current.closeModal());
    expect(result.current.isModalOpen).toBe(false);

    act(() => result.current.openCreateModal());
    fillValidGeneralForm(result);
    postAdminEventMock.mockImplementation(
      () => new Promise(() => undefined),
    );
    void act(() => {
      void result.current.onSubmit(fakeSubmitEvent());
    });
    await waitFor(() => expect(result.current.isSubmitting).toBe(true));
    act(() => result.current.closeModal());
    expect(result.current.isModalOpen).toBe(true);
  });

  it("onSubmit without token toasts sign-in required", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    await act(async () => {
      await result.current.onSubmit(fakeSubmitEvent());
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sign-in required" }),
    );
    expect(postAdminEventMock).not.toHaveBeenCalled();
  });

  it("onSubmit shows validation alert when form invalid", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    act(() => result.current.openCreateModal());
    await act(async () => {
      await result.current.onSubmit(fakeSubmitEvent());
    });
    expect(result.current.validationAlert).toBeTruthy();
    act(() => result.current.closeValidationAlert());
    expect(result.current.validationAlert).toBeNull();
  });

  it("creates an event and queues multi-file media upload", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    act(() => result.current.openCreateModal());
    fillValidGeneralForm(result);
    const files = [
      new File(["a"], "a.jpg", { type: "image/jpeg" }),
      new File(["b"], "b.jpg", { type: "image/jpeg" }),
    ];
    act(() => {
      result.current.form.onPickCatalogImages(asFileList(files));
    });

    await act(async () => {
      await result.current.onSubmit(fakeSubmitEvent());
    });

    expect(postAdminEventMock).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Event created" }),
    );
    await waitFor(() => {
      expect(postCatalogImagesMock).toHaveBeenCalledWith(
        "token-1",
        "new-event-id",
        files,
      );
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Uploading media in background" }),
    );
  });

  it("queues single-file media upload and reports upload failure", async () => {
    postCatalogImagesMock.mockRejectedValue(new Error("upload failed"));
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    act(() => result.current.openCreateModal());
    fillValidGeneralForm(result);
    const file = new File(["a"], "a.jpg", { type: "image/jpeg" });
    act(() => result.current.form.onPickCatalogImages(asFileList([file])));

    await act(async () => {
      await result.current.onSubmit(fakeSubmitEvent());
    });
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Media not saved" }),
      );
    });
  });

  it("queues single-file media upload success and non-Error upload failure", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    act(() => result.current.openCreateModal());
    fillValidGeneralForm(result);
    const file = new File(["a"], "a.jpg", { type: "image/jpeg" });
    act(() => result.current.form.onPickCatalogImages(asFileList([file])));
    await act(async () => {
      await result.current.onSubmit(fakeSubmitEvent());
    });
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Media uploaded" }),
      );
    });

    postCatalogImagesMock.mockRejectedValue("upload boom");
    act(() => result.current.openCreateModal());
    fillValidGeneralForm(result);
    act(() =>
      result.current.form.onPickCatalogImages(
        asFileList([new File(["b"], "b.jpg", { type: "image/jpeg" })]),
      ),
    );
    await act(async () => {
      await result.current.onSubmit(fakeSubmitEvent());
    });
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Media not saved",
          description: "Catalog media upload failed.",
        }),
      );
    });
  });

  it("patches an existing event", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
    const event = result.current.catalog.events[0]!;
    await act(async () => {
      await result.current.startEdit(event);
    });
    fillValidGeneralForm(result);
    await act(async () => {
      await result.current.onSubmit(fakeSubmitEvent());
    });
    expect(patchAdminEventMock).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Event updated" }),
    );
  });

  it("toasts Offline for Failed to fetch on submit", async () => {
    postAdminEventMock.mockRejectedValue(new Error("Failed to fetch"));
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    act(() => result.current.openCreateModal());
    fillValidGeneralForm(result);
    await act(async () => {
      await result.current.onSubmit(fakeSubmitEvent());
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Offline" }),
    );
  });

  it("toasts Offline for non-Error throws", async () => {
    postAdminEventMock.mockRejectedValue("boom");
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    act(() => result.current.openCreateModal());
    fillValidGeneralForm(result);
    await act(async () => {
      await result.current.onSubmit(fakeSubmitEvent());
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Offline" }),
    );
  });

  describe("upcoming schedule sync", () => {
    beforeEach(() => {
      pathnameRef.current = "/admin/on-coming-events";
    });

    async function prepareUpcomingCreate() {
      const { result } = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
      act(() => result.current.openCreateModal());
      fillValidGeneralForm(result);
      act(() => {
        result.current.form.setEventName("Gala Night");
        result.current.form.setExperienceMode("FIXED_EVENT");
        result.current.form.setSchedule(fixedScheduleForm());
        result.current.form.setEnableVenueSeating(true);
      });
      return result;
    }

    it("creates FIXED_EVENT schedule with venue seating", async () => {
      const result = await prepareUpcomingCreate();
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(createTemplateMock).toHaveBeenCalled();
      expect(patchVenueConfigMock).toHaveBeenCalledWith(
        "token-1",
        "new-event-id",
        expect.objectContaining({
          clientEnabled: true,
          fixedTicketCapacity: null,
        }),
      );
    });

    it("creates FIXED_EVENT with ticket capacity and mismatch throws", async () => {
      patchVenueConfigMock.mockResolvedValue({
        ok: true,
        config: {},
      });
      const result = await prepareUpcomingCreate();
      act(() => {
        result.current.form.setEnableVenueSeating(false);
        result.current.form.setFixedTicketCapacityInput("10");
      });
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          description: expect.stringMatching(/Expected 10 tickets but saved none/),
        }),
      );
    });

    it("creates FIXED_EVENT ticket capacity when saved capacity matches", async () => {
      patchVenueConfigMock.mockResolvedValue({
        ok: true,
        config: { fixedTicketCapacity: 10 },
      });
      const result = await prepareUpcomingCreate();
      act(() => {
        result.current.form.setEnableVenueSeating(false);
        result.current.form.setFixedTicketCapacityInput("10");
      });
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Event created" }),
      );
    });

    it("creates FIXED_EVENT with draft packages in one submit without reopen", async () => {
      pathnameRef.current = "/admin/on-coming-events";
      const { result } = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
      act(() => result.current.openCreateModal());
      fillValidGeneralForm(result);
      act(() => {
        result.current.form.setEventName("Package Gala");
        result.current.form.setExperienceMode("FIXED_EVENT");
        result.current.form.setSchedule(fixedScheduleForm());
        result.current.form.setEnablePackages(true);
        result.current.form.setActivities([
          {
            clientKey: "ck-act-1",
            title: "Show A",
            description: "Long enough activity description here",
            accentColor: "",
            showText: true,
            displayOrder: 0,
          },
        ]);
        result.current.form.setDraftPackages([
          {
            clientKey: "ck-pkg-1",
            title: "VIP",
            description: "",
            badge: "",
            priceInput: "40.00",
            capacityInput: "40",
            arrivalStartTime: "18:00",
            arrivalEndTime: "20:00",
            activityRefs: ["ck-act-1"],
            displayOrder: 0,
          },
        ]);
      });

      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });

      expect(persistEventActivitiesMock).toHaveBeenCalled();
      expect(createFixedEventPackageMock).toHaveBeenCalledWith(
        "token-1",
        "new-event-id",
        expect.objectContaining({
          title: "VIP",
          activityIds: ["act-1"],
          priceCents: 4000,
          capacity: 40,
        }),
      );
      expect(result.current.isModalOpen).toBe(false);
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Event created",
          description: expect.stringMatching(/packages/i),
        }),
      );
    });

    it("opens edit when package create fails after event create", async () => {
      createFixedEventPackageMock.mockResolvedValue({
        ok: false,
        message: "Package boom",
      });
      server.use(
        http.get("*/api/v1/events/admin", () =>
          HttpResponse.json([
            makeAdminEvent({
              id: "new-event-id",
              eventTypeName: "Package Gala Fail",
              publicSection: "UPCOMING_EVENTS",
            }),
          ]),
        ),
      );
      pathnameRef.current = "/admin/on-coming-events";
      const { result } = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
      act(() => result.current.openCreateModal());
      fillValidGeneralForm(result);
      act(() => {
        result.current.form.setEventName("Package Gala Fail");
        result.current.form.setExperienceMode("FIXED_EVENT");
        result.current.form.setSchedule(fixedScheduleForm());
        result.current.form.setEnablePackages(true);
        result.current.form.setActivities([
          {
            clientKey: "ck-act-1",
            title: "Show A",
            description: "Long enough activity description here",
            accentColor: "",
            showText: true,
            displayOrder: 0,
          },
        ]);
        result.current.form.setDraftPackages([
          {
            clientKey: "ck-pkg-1",
            title: "VIP",
            description: "",
            badge: "",
            priceInput: "40.00",
            capacityInput: "40",
            arrivalStartTime: "18:00",
            arrivalEndTime: "20:00",
            activityRefs: ["ck-act-1"],
            displayOrder: 0,
          },
        ]);
      });

      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });

      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Event created, packages incomplete",
          description: "Package boom",
        }),
      );
      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.form.editingId).toBe("new-event-id");
    });

    it("creates RECURRING_WEEKLY with package and regenerates sessions", async () => {
      const result = await prepareUpcomingCreate();
      act(() => {
        result.current.form.setExperienceMode("RECURRING_WEEKLY");
        result.current.form.setSchedule(recurringScheduleForm());
        result.current.form.setMonthPackageEnabled(true);
        result.current.form.setMonthPackagePrice("99");
        result.current.form.setMonthPackageLabel("Month pass");
      });
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(regenerateSessionsMock).toHaveBeenCalled();
      expect(patchVenueConfigMock).toHaveBeenCalledWith(
        "token-1",
        "new-event-id",
        expect.objectContaining({
          classPackageEnabled: true,
          classPackagePrice: 99,
          classPackageLabel: "Month pass",
        }),
      );
    });

    it("throws when regenerate fails", async () => {
      regenerateSessionsMock.mockResolvedValue({ ok: false, message: "regen fail" });
      const result = await prepareUpcomingCreate();
      act(() => {
        result.current.form.setExperienceMode("RECURRING_WEEKLY");
        result.current.form.setSchedule(recurringScheduleForm());
      });
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "regen fail",
        }),
      );
    });

    it("throws when template create fails", async () => {
      createTemplateMock.mockResolvedValue({ ok: false, message: "tmpl fail" });
      const result = await prepareUpcomingCreate();
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: "tmpl fail" }),
      );
    });

    it("uses default error messages when schedule APIs omit message", async () => {
      createTemplateMock.mockResolvedValue({ ok: false });
      const result = await prepareUpcomingCreate();
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Could not save the event schedule.",
        }),
      );

      createTemplateMock.mockResolvedValue({ ok: true, template: { id: "tmpl-1" } });
      patchVenueConfigMock.mockResolvedValue({ ok: false });
      const result2 = await prepareUpcomingCreate();
      await act(async () => {
        await result2.current.onSubmit(fakeSubmitEvent());
      });
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Could not apply the event schedule.",
        }),
      );

      patchVenueConfigMock.mockResolvedValue({ ok: true, config: {} });
      regenerateSessionsMock.mockResolvedValue({ ok: false });
      const result3 = await prepareUpcomingCreate();
      act(() => {
        result3.current.form.setExperienceMode("RECURRING_WEEKLY");
        result3.current.form.setSchedule(recurringScheduleForm());
      });
      await act(async () => {
        await result3.current.onSubmit(fakeSubmitEvent());
      });
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringMatching(/class sessions could not be generated/i),
        }),
      );
    });

    it("RECURRING without month package clears package fields", async () => {
      const result = await prepareUpcomingCreate();
      act(() => {
        result.current.form.setExperienceMode("RECURRING_WEEKLY");
        result.current.form.setSchedule(recurringScheduleForm());
        result.current.form.setMonthPackageEnabled(false);
      });
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(patchVenueConfigMock).toHaveBeenCalledWith(
        "token-1",
        "new-event-id",
        expect.objectContaining({
          classPackageEnabled: false,
          classPackagePrice: null,
          classPackageLabel: null,
        }),
      );
    });

    it("RECURRING package enabled with blank label stores null label", async () => {
      const result = await prepareUpcomingCreate();
      act(() => {
        result.current.form.setExperienceMode("RECURRING_WEEKLY");
        result.current.form.setSchedule(recurringScheduleForm());
        result.current.form.setMonthPackageEnabled(true);
        result.current.form.setMonthPackagePrice("50");
        result.current.form.setMonthPackageLabel("   ");
      });
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(patchVenueConfigMock).toHaveBeenCalledWith(
        "token-1",
        "new-event-id",
        expect.objectContaining({
          classPackageEnabled: true,
          classPackagePrice: 50,
          classPackageLabel: null,
        }),
      );
    });

    it("throws when venue config link fails", async () => {
      patchVenueConfigMock.mockResolvedValue({ ok: false, message: "link fail" });
      const result = await prepareUpcomingCreate();
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: "link fail" }),
      );
    });

    it("patches existing template when linkedTemplateId is set", async () => {
      fetchVenueConfigMock.mockResolvedValue({
        ok: true,
        config: {
          reservationEventTemplate: { id: "tmpl-existing", name: "Private weddings" },
          clientEnabled: false,
          fixedTicketCapacity: null,
          classPackageEnabled: false,
          classPackagePrice: null,
          classPackageLabel: null,
        },
      });
      const { result } = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
      const event = result.current.catalog.events[0]!;
      await act(async () => {
        await result.current.startEdit(event);
      });
      expect(result.current.form.linkedTemplateId).toBe("tmpl-existing");
      fillValidGeneralForm(result);
      act(() => {
        result.current.form.setEventName("Updated Gala");
        result.current.form.setExperienceMode("FIXED_EVENT");
        result.current.form.setSchedule(fixedScheduleForm());
        result.current.form.setEnableVenueSeating(true);
      });
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(patchTemplateMock).toHaveBeenCalled();
    });

    it("unlinks template when switching to NORMAL", async () => {
      fetchVenueConfigMock.mockResolvedValue({
        ok: true,
        config: {
          reservationEventTemplate: { id: "tmpl-existing", name: "Private weddings" },
          clientEnabled: false,
          fixedTicketCapacity: null,
          classPackageEnabled: false,
          classPackagePrice: null,
          classPackageLabel: null,
        },
      });
      const { result } = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
      await act(async () => {
        await result.current.startEdit(result.current.catalog.events[0]!);
      });
      fillValidGeneralForm(result);
      act(() => result.current.form.setExperienceMode("NORMAL"));
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(patchVenueConfigMock).toHaveBeenCalledWith(
        "token-1",
        expect.any(String),
        { reservationEventTemplateId: null },
      );
    });

    it("NORMAL without linked template skips sync", async () => {
      const result = await prepareUpcomingCreate();
      act(() => result.current.form.setExperienceMode("NORMAL"));
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(createTemplateMock).not.toHaveBeenCalled();
      expect(patchVenueConfigMock).not.toHaveBeenCalled();
    });

    it("unlinks fail throws", async () => {
      fetchVenueConfigMock.mockResolvedValue({
        ok: true,
        config: {
          reservationEventTemplate: { id: "tmpl-existing", name: "Private weddings" },
          clientEnabled: false,
          fixedTicketCapacity: null,
          classPackageEnabled: false,
          classPackagePrice: null,
          classPackageLabel: null,
        },
      });
      patchVenueConfigMock.mockResolvedValue({ ok: false, message: "unlink fail" });
      const { result } = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
      await act(async () => {
        await result.current.startEdit(result.current.catalog.events[0]!);
      });
      fillValidGeneralForm(result);
      act(() => result.current.form.setExperienceMode("NORMAL"));
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: "unlink fail" }),
      );
    });

    it("startEdit falls back to templates by name when config has no template", async () => {
      fetchVenueConfigMock.mockResolvedValue({
        ok: true,
        config: {
          reservationEventTemplate: null,
          clientEnabled: true,
          fixedTicketCapacity: 20,
          classPackageEnabled: false,
          classPackagePrice: null,
          classPackageLabel: null,
        },
      });
      fetchTemplatesMock.mockResolvedValue({
        ok: true,
        templates: [
          {
            id: "tmpl-fallback",
            name: "Private weddings",
            linkedEventIds: [],
          },
        ],
      });
      const { result } = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
      await act(async () => {
        await result.current.startEdit(result.current.catalog.events[0]!);
      });
      expect(result.current.form.linkedTemplateId).toBe("tmpl-fallback");
      expect(result.current.isModalOpen).toBe(true);
    });

    it("startEdit matches template linkedEventIds and skips failed template fetch", async () => {
      fetchVenueConfigMock.mockResolvedValue({
        ok: true,
        config: {
          reservationEventTemplate: null,
          clientEnabled: false,
          fixedTicketCapacity: null,
          classPackageEnabled: true,
          classPackagePrice: 40,
          classPackageLabel: "Pass",
        },
      });
      fetchTemplatesMock.mockResolvedValueOnce({ ok: false, templates: [] });
      const { result, unmount } = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
      const event = result.current.catalog.events[0]!;
      await act(async () => {
        await result.current.startEdit(event);
      });
      expect(result.current.form.linkedTemplateId).toBeNull();
      unmount();

      fetchTemplatesMock.mockResolvedValue({
        ok: true,
        templates: [
          {
            id: "tmpl-other",
            name: "Other name",
          },
          {
            id: "tmpl-wrong-link",
            name: event.eventTypeName,
            linkedEventIds: ["00000000-0000-4000-8000-000000000099"],
          },
          {
            id: "tmpl-linked",
            name: event.eventTypeName,
            linkedEventIds: [event.id],
            scheduleMode: "RECURRING_WEEKLY",
            weekdays: defaultReservationWeekdays(),
            classSections: [],
          },
        ],
      });
      const second = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() =>
        expect(second.result.current.catalog.events.length).toBeGreaterThan(0),
      );
      await act(async () => {
        await second.result.current.startEdit(second.result.current.catalog.events[0]!);
      });
      expect(second.result.current.form.linkedTemplateId).toBe("tmpl-linked");
    });

    it("startEdit matches template with omitted linkedEventIds", async () => {
      fetchVenueConfigMock.mockResolvedValue({
        ok: true,
        config: {
          reservationEventTemplate: null,
          clientEnabled: false,
          fixedTicketCapacity: null,
          classPackageEnabled: false,
          classPackagePrice: null,
          classPackageLabel: null,
        },
      });
      const { result } = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
      const event = result.current.catalog.events[0]!;
      fetchTemplatesMock.mockResolvedValue({
        ok: true,
        templates: [{ id: "tmpl-no-link-field", name: event.eventTypeName }],
      });
      await act(async () => {
        await result.current.startEdit(event);
      });
      expect(result.current.form.linkedTemplateId).toBe("tmpl-no-link-field");
    });

    it("startEdit with null venue config still opens modal", async () => {
      fetchVenueConfigMock.mockResolvedValue({ ok: true, config: null });
      const { result } = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
      await act(async () => {
        await result.current.startEdit(result.current.catalog.events[0]!);
      });
      expect(result.current.isModalOpen).toBe(true);
    });

    it("unlinks fail uses default message when omitted", async () => {
      fetchVenueConfigMock.mockResolvedValue({
        ok: true,
        config: {
          reservationEventTemplate: { id: "tmpl-existing", name: "Private weddings" },
          clientEnabled: false,
          fixedTicketCapacity: null,
          classPackageEnabled: false,
          classPackagePrice: null,
          classPackageLabel: null,
        },
      });
      patchVenueConfigMock.mockResolvedValue({ ok: false });
      const { result } = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
      await act(async () => {
        await result.current.startEdit(result.current.catalog.events[0]!);
      });
      fillValidGeneralForm(result);
      act(() => result.current.form.setExperienceMode("NORMAL"));
      await act(async () => {
        await result.current.onSubmit(fakeSubmitEvent());
      });
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Could not detach the previous schedule.",
        }),
      );
    });

    it("startEdit skips venue fetch without token", async () => {
      const { result } = renderHook(() => useEventsPage({ upcomingOnly: true }));
      await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
      const event = result.current.catalog.events[0]!;
      getTokenMock.mockReturnValue(null);
      fetchVenueConfigMock.mockClear();
      await act(async () => {
        await result.current.startEdit(event);
      });
      expect(fetchVenueConfigMock).not.toHaveBeenCalled();
      expect(result.current.isModalOpen).toBe(true);
    });
  });

  it("removeExistingCatalogImage success, no token, and error", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
    await act(async () => {
      await result.current.startEdit(result.current.catalog.events[0]!);
    });
    await act(async () => {
      await result.current.removeExistingCatalogImage(FIXTURE_CATALOG_IMAGE_ID);
    });
    expect(deleteGalleryPhotoMock).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Media removed" }),
    );

    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.removeExistingCatalogImage("x");
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sign-in required" }),
    );

    getTokenMock.mockReturnValue("token-1");
    deleteGalleryPhotoMock.mockRejectedValue(new Error("del fail"));
    await act(async () => {
      await result.current.removeExistingCatalogImage("x");
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ description: "del fail" }),
    );
  });

  it("onToggleActive blocks when active with bookings; hides active; requires token", async () => {
    server.use(
      http.get("*/api/v1/events/types/admin", () =>
        HttpResponse.json([makeEventTypeOption()]),
      ),
      http.get("*/api/v1/events/admin", () =>
        HttpResponse.json([
          makeAdminEvent({ bookingCount: 2, isActive: true }),
          makeAdminEvent({
            id: FIXTURE_EVENT_ID_2,
            isActive: true,
            bookingCount: 0,
            catalogImages: [],
          }),
        ]),
      ),
    );
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.events.length).toBe(2));

    const blocked = {
      ...result.current.catalog.events.find((e) => e.id === FIXTURE_EVENT_ID)!,
      isActive: true,
      bookingCount: 2,
    };
    await act(async () => {
      await result.current.onToggleActive(blocked);
    });
    expect(patchAdminEventActiveMock).not.toHaveBeenCalled();

    const hideable = result.current.catalog.events.find((e) => e.id === FIXTURE_EVENT_ID_2)!;
    await act(async () => {
      await result.current.startEdit(hideable);
    });
    await act(async () => {
      await result.current.onToggleActive(hideable);
    });
    expect(patchAdminEventActiveMock).toHaveBeenCalledWith(
      "token-1",
      FIXTURE_EVENT_ID_2,
      false,
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Event hidden" }),
    );

    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onToggleActive(hideable);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sign-in required" }),
    );
  });

  it("onToggleActive error path", async () => {
    patchAdminEventActiveMock.mockRejectedValue(new Error("toggle fail"));
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    const inactive = result.current.catalog.events.find((e) => !e.isActive)!;
    await act(async () => {
      await result.current.onToggleActive(inactive);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ description: "toggle fail" }),
    );
  });

  it("onToggleActive shows Event visible and treats missing bookingCount as zero", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    const inactive = {
      ...result.current.catalog.events.find((e) => !e.isActive)!,
      bookingCount: undefined,
    };
    await act(async () => {
      await result.current.onToggleActive(inactive as ReturnType<typeof makeAdminEvent>);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Event visible" }),
    );
  });

  it("delete without editing or viewing still succeeds", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
    const target = result.current.catalog.events.find((e) => e.id === FIXTURE_EVENT_ID_2)!;
    act(() => result.current.openDeleteConfirm(target));
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Event deleted" }),
    );
    expect(result.current.pendingDelete).toBeNull();
  });

  it("delete flow: blocked, no token, success clearing view/edit, close while deleting", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));

    const withBookings = makeAdminEvent({ bookingCount: 3 });
    act(() => result.current.openDeleteConfirm(withBookings));
    expect(result.current.pendingDelete).toBeNull();

    const target = result.current.catalog.events.find((e) => e.id === FIXTURE_EVENT_ID_2)!;
    act(() => result.current.openDeleteConfirm(target));
    expect(result.current.pendingDelete?.id).toBe(FIXTURE_EVENT_ID_2);

    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sign-in required" }),
    );

    getTokenMock.mockReturnValue("token-1");
    await act(async () => {
      await result.current.startEdit(target);
    });
    act(() => result.current.setViewEvent(target));
    act(() => result.current.openDeleteConfirm(target));

    let resolveDelete!: () => void;
    deleteAdminEventMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
    );
    void result.current.onConfirmDelete();
    await waitFor(() => expect(result.current.isDeleting).toBe(true));
    act(() => result.current.closeDeleteModal());
    expect(result.current.pendingDelete).not.toBeNull();
    await act(async () => {
      resolveDelete();
    });
    await waitFor(() => expect(result.current.pendingDelete).toBeNull());
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.viewEvent).toBeNull();
  });

  it("delete error path and closeDeleteModal when idle", async () => {
    deleteAdminEventMock.mockRejectedValue(new Error("delete fail"));
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.events.length).toBeGreaterThan(0));
    const target = result.current.catalog.events.find((e) => e.id === FIXTURE_EVENT_ID_2)!;
    act(() => result.current.openDeleteConfirm(target));
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ description: "delete fail" }),
    );
    act(() => result.current.openDeleteConfirm(target));
    act(() => result.current.closeDeleteModal());
    expect(result.current.pendingDelete).toBeNull();
  });

  it("create without returned id skips schedule and media queue", async () => {
    postAdminEventMock.mockResolvedValue({});
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    act(() => result.current.openCreateModal());
    fillValidGeneralForm(result);
    await act(async () => {
      await result.current.onSubmit(fakeSubmitEvent());
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Event created" }),
    );
    expect(postCatalogImagesMock).not.toHaveBeenCalled();
  });

  it("onConfirmDelete no-ops without pendingDelete", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(deleteAdminEventMock).not.toHaveBeenCalled();
  });

  it("exposes usage helpers", async () => {
    const { result } = renderHook(() => useEventsPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    expect(result.current.canDeleteEvent(makeAdminEvent())).toBe(true);
    expect(result.current.cannotDeactivateWhileActive(makeAdminEvent({ bookingCount: 1 }))).toBe(
      true,
    );
    expect(result.current.getDeleteBlockedDescription(makeAdminEvent({ bookingCount: 1 }))).toBeTruthy();
    expect(
      result.current.getDeactivateBlockedDescription(makeAdminEvent({ bookingCount: 1 })),
    ).toBeTruthy();
  });
});
