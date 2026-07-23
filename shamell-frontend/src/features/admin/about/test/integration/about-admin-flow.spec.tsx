/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { renderWithProviders } from "../utils/renderWithProviders";
import { makeAdminAboutRow } from "../fixtures/about.fixture";
import { useAdminAboutForm } from "../../hooks/useAdminAboutForm";
import { AboutEditModal } from "../../components/AboutEditModal";

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("../../lib/aboutAdminAuth", () => ({
  getAdminBearerToken: () => "token-1",
}));

const seed = makeAdminAboutRow({
  title: "Seed Title",
  paragraph1: "Seed paragraph",
  coreValues: ["Seed"],
});

function AboutEditFlow({ onSaved }: { onSaved: () => Promise<void> }) {
  const form = useAdminAboutForm({
    record: seed,
    onSaved,
    closeHeroLightbox: () => undefined,
  });

  useEffect(() => {
    form.syncFormFromRecord(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot seed for the flow
  }, []);

  return (
    <AboutEditModal
      record={seed}
      isOpen
      onClose={() => undefined}
      onSubmit={form.onSubmit}
      title={form.title}
      setTitle={form.setTitle}
      paragraph1={form.paragraph1}
      setParagraph1={form.setParagraph1}
      coreValuesText={form.coreValuesText}
      setCoreValuesText={form.setCoreValuesText}
      existingImageUrl={form.existingImageUrl}
      existingHeroMediaType={form.existingHeroMediaType}
      imageFile={form.imageFile}
      setImageFile={form.setImageFile}
      imagePreviewUrl={form.imagePreviewUrl}
      imageFileInputRef={form.imageFileInputRef}
      isSubmitting={form.isSubmitting}
      isDeletingHero={form.isDeletingHero}
      onOpenDeleteHeroConfirm={() => undefined}
      onDiscardSelectedFile={form.discardSelectedFile}
      onOpenLightbox={() => undefined}
    />
  );
}

describe("about admin edit flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("edits fields and PATCHes the admin about API", async () => {
    const user = userEvent.setup();
    let received: FormData | null = null;
    server.use(
      http.patch("*/api/v1/about/admin", async ({ request }) => {
        received = await request.formData();
        return HttpResponse.json(
          makeAdminAboutRow({
            title: String(received.get("title") ?? ""),
            paragraph1: String(received.get("paragraph1") ?? ""),
            coreValues: received.getAll("coreValues").map(String),
          }),
        );
      }),
    );

    const onSaved = vi.fn(async () => undefined);
    renderWithProviders(<AboutEditFlow onSaved={onSaved} />);

    const title = await screen.findByLabelText(/title/i);
    await user.clear(title);
    await user.type(title, "Updated About");

    const paragraph = screen.getByLabelText(/texto principal/i);
    await user.clear(paragraph);
    await user.type(paragraph, "Updated body");

    const values = screen.getByLabelText(/values/i);
    await user.clear(values);
    await user.type(values, "Craft\nPresence");

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(received).not.toBeNull());
    expect(received!.get("title")).toBe("Updated About");
    expect(received!.get("paragraph1")).toBe("Updated body");
    expect(received!.getAll("coreValues")).toEqual(["Craft", "Presence"]);
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });
});
