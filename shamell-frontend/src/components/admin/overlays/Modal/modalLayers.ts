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

/** @deprecated Prefer MODAL_LAYERS.overlay */
export const ADMIN_MODAL_OVERLAY_Z_CLASS = MODAL_LAYERS.overlay;

/** @deprecated Prefer MODAL_LAYERS.mediaPreview */
export const ADMIN_MEDIA_PREVIEW_OVERLAY_Z_CLASS = MODAL_LAYERS.mediaPreview;

/** @deprecated Prefer MODAL_LAYERS.nestedPicker */
export const ADMIN_NESTED_PICKER_OVERLAY_Z_CLASS = MODAL_LAYERS.nestedPicker;

/** @deprecated Prefer MODAL_LAYERS.busy */
export const ADMIN_BUSY_OVERLAY_Z_CLASS = MODAL_LAYERS.busy;
