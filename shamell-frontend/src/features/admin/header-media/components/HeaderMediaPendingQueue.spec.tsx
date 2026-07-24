/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fileKey } from "../lib/headerMediaUtils";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({ alt = "", src }: { alt?: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

import HeaderMediaPendingQueue from "./HeaderMediaPendingQueue";

function renderQueue(
  overrides: Partial<React.ComponentProps<typeof HeaderMediaPendingQueue>> = {},
) {
  const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
  const props: React.ComponentProps<typeof HeaderMediaPendingQueue> = {
    pendingFiles: [file],
    pendingPreviews: { [fileKey(file)]: "blob:preview" },
    pendingTotalBytes: file.size,
    formatFileSize: (bytes) => `${bytes} B`,
    isSaving: false,
    onSubmit: vi.fn((e) => e.preventDefault()),
    onPickFiles: vi.fn(),
    onClearPending: vi.fn(),
    onRemovePendingOne: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<HeaderMediaPendingQueue {...props} />), props, file };
}

describe("HeaderMediaPendingQueue", () => {
  it("renders null when empty", () => {
    const { container } = renderWithProviders(
      <HeaderMediaPendingQueue
        pendingFiles={[]}
        pendingPreviews={{}}
        pendingTotalBytes={0}
        formatFileSize={(b) => `${b}`}
        isSaving={false}
        onSubmit={vi.fn()}
        onPickFiles={vi.fn()}
        onClearPending={vi.fn()}
        onRemovePendingOne={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists pending files and publish controls", () => {
    renderQueue();
    expect(screen.getByText("02 — READY TO PUBLISH")).toBeInTheDocument();
    expect(screen.getByText("a.jpg")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Publish 1 file/i })).toBeInTheDocument();
  });

  it("calls clear remove and pick handlers", async () => {
    const user = userEvent.setup();
    const { props } = renderQueue();
    await user.click(screen.getByRole("button", { name: "+ ADD MORE" }));
    await user.click(screen.getByRole("button", { name: "Remove file" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onPickFiles).toHaveBeenCalled();
    expect(props.onRemovePendingOne).toHaveBeenCalled();
    expect(props.onClearPending).toHaveBeenCalled();
  });

  it("shows publishing state while saving", () => {
    renderQueue({ isSaving: true });
    expect(screen.getByText("Publicando...")).toBeInTheDocument();
  });
});
