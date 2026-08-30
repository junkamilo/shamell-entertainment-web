import { describe, it, expect, vi, beforeEach } from "vitest";
import type { EventActivityForm } from "../types/fixedEventPackage.types";
import { persistEventActivities } from "./persistEventActivities";

vi.mock("./fixedEventPackagesApi", () => ({
  replaceEventActivities: vi.fn(),
  postEventActivityMedia: vi.fn(),
}));

import {
  postEventActivityMedia,
  replaceEventActivities,
} from "./fixedEventPackagesApi";

const replaceMock = vi.mocked(replaceEventActivities);
const uploadMock = vi.mocked(postEventActivityMedia);

function makeForm(
  overrides: Partial<EventActivityForm> & Pick<EventActivityForm, "title">,
): EventActivityForm {
  return {
    description: "Activity description",
    accentColor: "",
    showText: true,
    displayOrder: 0,
    mediaUrl: null,
    mediaType: null,
    pendingMediaFile: null,
    ...overrides,
  };
}

describe("persistEventActivities", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    uploadMock.mockReset();
  });

  it("uploads media then sets showText false when hiding text with a new file", async () => {
    const file = new File(["x"], "poster.jpg", { type: "image/jpeg" });
    const next = [
      makeForm({
        id: "act-1",
        title: "Workshop",
        showText: false,
        pendingMediaFile: file,
      }),
    ];

    replaceMock
      .mockResolvedValueOnce({
        ok: true,
        activities: [
          {
            id: "act-1",
            title: "Workshop",
            description: "Activity description",
            accentColor: null,
            showText: true,
            displayOrder: 0,
            mediaUrl: null,
            mediaType: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        activities: [
          {
            id: "act-1",
            title: "Workshop",
            description: "Activity description",
            accentColor: null,
            showText: false,
            displayOrder: 0,
            mediaUrl: "https://cdn.example/poster.jpg",
            mediaType: "IMAGE",
          },
        ],
      });

    uploadMock.mockResolvedValue({
      ok: true,
      activity: {
        id: "act-1",
        title: "Workshop",
        description: "Activity description",
        accentColor: null,
        showText: true,
        displayOrder: 0,
        mediaUrl: "https://cdn.example/poster.jpg",
        mediaType: "IMAGE",
      },
    });

    const result = await persistEventActivities("token", "evt-1", next);

    expect(result.ok).toBe(true);
    expect(replaceMock).toHaveBeenCalledTimes(2);
    expect(replaceMock.mock.calls[0]![2][0]!.showText).toBe(true);
    expect(replaceMock.mock.calls[1]![2][0]!.showText).toBe(false);
    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(result.activities[0]?.showText).toBe(false);
    expect(result.activities[0]?.mediaUrl).toBe("https://cdn.example/poster.jpg");
  });

  it("sets showText false in one pass when media already exists", async () => {
    const next = [
      makeForm({
        id: "act-1",
        title: "Workshop",
        showText: false,
        mediaUrl: "https://cdn.example/existing.jpg",
        mediaType: "IMAGE",
      }),
    ];

    replaceMock.mockResolvedValue({
      ok: true,
      activities: [
        {
          id: "act-1",
          title: "Workshop",
          description: "Activity description",
          accentColor: null,
          showText: false,
          displayOrder: 0,
          mediaUrl: "https://cdn.example/existing.jpg",
          mediaType: "IMAGE",
        },
      ],
    });

    const result = await persistEventActivities("token", "evt-1", next);

    expect(result.ok).toBe(true);
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock.mock.calls[0]![2][0]!.showText).toBe(false);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("filters inactive activities from the result", async () => {
    replaceMock.mockResolvedValue({
      ok: true,
      activities: [
        {
          id: "act-1",
          title: "Active",
          description: "Activity description",
          accentColor: null,
          showText: true,
          displayOrder: 0,
          mediaUrl: null,
          mediaType: null,
          isActive: true,
        },
        {
          id: "act-2",
          title: "Gone",
          description: "Activity description",
          accentColor: null,
          showText: true,
          displayOrder: 1,
          mediaUrl: null,
          mediaType: null,
          isActive: false,
        },
      ],
    });

    const result = await persistEventActivities("token", "evt-1", [
      makeForm({ id: "act-1", title: "Active" }),
    ]);

    expect(result.ok).toBe(true);
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]?.id).toBe("act-1");
  });
});
