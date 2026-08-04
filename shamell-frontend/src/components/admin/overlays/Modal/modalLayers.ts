export const MODAL_LAYERS = {
  /** AdminModal root overlay. */
  overlay: "z-200",
  /** Media preview lightbox above standard admin modals. */
  mediaPreview: "z-[205]",
  /** Date/time pickers portaled above an open Modal. */
  nestedPicker: "z-[210]",
  /** Full-screen busy state above an open Modal (save / upload). */
  busy: "z-[220]",
} as const;
