import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import AdminModal from "@/components/admin/AdminModal";
import { ADMIN_BUSY_OVERLAY_Z_CLASS } from "@/components/admin/adminModalLayers";
import ShamellBusyOverlay from "@/components/shared/ShamellBusyOverlay";
import {
  ReservationEventScheduleSections,
  type ScheduleFormState,
} from "@/app/shamell-admin/on-coming-events/reservation-events/components/ReservationEventScheduleSections";
import { cn } from "@/lib/utils";
import { MAX_CATALOG_IMAGES } from "../lib/eventsConstants";
import { isVideoCatalogItem, isVideoFile } from "../lib/eventsMedia";
import type {
  CatalogImage,
  EventPublicSection,
  EventsEventTypeOption,
  UpcomingExperienceMode,
} from "../types/events.types";

type Props = {
  isOpen: boolean;
  editingId: string | null;
  isSubmitting: boolean;
  submittingMessage?: string | null;
  canSubmit: boolean;
  freeEventNameMode?: boolean;
  eventName: string;
  onEventNameChange: (value: string) => void;
  activeEventTypes: EventsEventTypeOption[];
  eventTypeId: string;
  selectedTypeName: string | undefined;
  isTypeDropdownOpen: boolean;
  onTypeDropdownToggle: () => void;
  onSelectEventType: (id: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  itemsText: string;
  onItemsTextChange: (value: string) => void;
  priceInput: string;
  onPriceInputChange: (value: string) => void;
  publicSection: EventPublicSection;
  onPublicSectionChange: (value: EventPublicSection) => void;
  lockPublicSection?: boolean;
  existingImages: CatalogImage[];
  pendingFiles: File[];
  pendingPreviewUrls: string[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPickCatalogImages: (fileList: FileList | null) => void;
  onRemovePendingAt: (index: number) => void;
  onRemoveExistingImage: (photoId: string) => void;
  experienceMode?: UpcomingExperienceMode;
  onExperienceModeChange?: (mode: UpcomingExperienceMode) => void;
  schedule?: ScheduleFormState;
  onScheduleChange?: Dispatch<SetStateAction<ScheduleFormState>>;
  enableVenueSeating?: boolean;
  onEnableVenueSeatingChange?: (enabled: boolean) => void;
  fixedTicketCapacityInput?: string;
  onFixedTicketCapacityInputChange?: (value: string) => void;
};

export default function EventsFormModal({
  isOpen,
  editingId,
  isSubmitting,
  submittingMessage = null,
  canSubmit,
  freeEventNameMode = false,
  eventName,
  onEventNameChange,
  activeEventTypes,
  eventTypeId,
  selectedTypeName,
  isTypeDropdownOpen,
  onTypeDropdownToggle,
  onSelectEventType,
  description,
  onDescriptionChange,
  itemsText,
  onItemsTextChange,
  priceInput,
  onPriceInputChange,
  publicSection,
  onPublicSectionChange,
  lockPublicSection = false,
  existingImages,
  pendingFiles,
  pendingPreviewUrls,
  onClose,
  onSubmit,
  onPickCatalogImages,
  onRemovePendingAt,
  onRemoveExistingImage,
  experienceMode = "NORMAL",
  onExperienceModeChange,
  schedule,
  onScheduleChange,
  enableVenueSeating = false,
  onEnableVenueSeatingChange,
  fixedTicketCapacityInput = "",
  onFixedTicketCapacityInputChange,
}: Props) {
  return (
    <>
      <ShamellBusyOverlay
        active={isSubmitting}
        title={submittingMessage ?? "Saving event…"}
        description="Please wait while we save your event and catalog media."
        overlayZClass={ADMIN_BUSY_OVERLAY_Z_CLASS}
      />
      <AdminModal
        title={
          freeEventNameMode
            ? editingId
              ? "Edit upcoming event"
              : "New upcoming event"
            : editingId
              ? "Edit event"
              : "New event"
        }
        isOpen={isOpen}
        onClose={() => {
          if (!isSubmitting) onClose();
        }}
      >
      <form id="event-form" noValidate onSubmit={onSubmit} className="space-y-6">
        {freeEventNameMode ? (
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">
              EVENT NAME
            </span>
            <input
              type="text"
              value={eventName}
              onChange={(event) => onEventNameChange(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder="e.g. Summer Gala 2026"
              autoComplete="off"
            />
          </label>
        ) : null}

        {lockPublicSection && schedule && onScheduleChange ? (
          <ReservationEventScheduleSections
            value={schedule}
            onChange={onScheduleChange}
            experienceMode={experienceMode}
            onExperienceModeChange={(mode) =>
              onExperienceModeChange?.(mode as UpcomingExperienceMode)
            }
            enableVenueSeating={enableVenueSeating}
            onEnableVenueSeatingChange={onEnableVenueSeatingChange}
            fixedTicketCapacityInput={fixedTicketCapacityInput}
            onFixedTicketCapacityInputChange={onFixedTicketCapacityInputChange}
          />
        ) : null}

        {!freeEventNameMode ? (
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">EVENT TYPE</span>
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => {
                  if (activeEventTypes.length === 0) return;
                  onTypeDropdownToggle();
                }}
                className="shamell-glass-trigger flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm text-foreground"
              >
                <span className={selectedTypeName ? "text-foreground" : "text-foreground/55"}>
                  {selectedTypeName ?? "Create an event type first"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gold/80 transition ${isTypeDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isTypeDropdownOpen && activeEventTypes.length > 0 ? (
                <div className="shamell-scrollbar absolute left-0 top-14 z-40 max-h-56 w-full overflow-y-auto rounded-xl border border-gold/35 bg-[#0b0f14] p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
                  {activeEventTypes.map((item) => {
                    const isSelected = eventTypeId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectEventType(item.id)}
                        className={cn(
                          "mb-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition last:mb-0",
                          isSelected
                            ? "border border-gold/35 bg-gold/15 text-gold"
                            : "border border-transparent text-foreground/80 hover:border-gold/20 hover:bg-gold/10 hover:text-gold-light",
                        )}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </label>
        ) : null}

        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">DESCRIPTION</span>
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
            placeholder="Describe this event..."
          />
        </label>

        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">LINE ITEMS (ONE PER LINE)</span>
          <textarea
            value={itemsText}
            onChange={(event) => onItemsTextChange(event.target.value)}
            rows={5}
            className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
            placeholder={"Line 1\nLine 2\nLine 3"}
          />
        </label>

        {!lockPublicSection ? (
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">PUBLIC SECTION</span>
            <select
              value={publicSection}
              onChange={(event) =>
                onPublicSectionChange(event.target.value as EventPublicSection)
              }
              className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
            >
              <option value="GENERAL">General (Types of Events)</option>
              <option value="UPCOMING_EVENTS">Upcoming Events</option>
            </select>
          </label>
        ) : null}

        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">PRICE (OPTIONAL)</span>
          <input
            type="text"
            inputMode="decimal"
            value={priceInput}
            onChange={(event) => onPriceInputChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
            placeholder="e.g. 2500 or 2500.50"
            autoComplete="off"
          />
        </label>

        <div className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">CATALOG MEDIA</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {existingImages.map((img) => (
              <div
                key={img.id}
                className="relative h-20 w-20 overflow-hidden rounded-xl border border-gold/22 bg-black/40"
              >
                {isVideoCatalogItem(img) ? (
                  <video
                    src={img.imageUrl}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    aria-hidden
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => void onRemoveExistingImage(img.id)}
                  className="absolute right-1 top-1 rounded-md border border-white/25 bg-black/70 p-1 text-white transition hover:bg-red-500/80"
                  aria-label="Remove media"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
            {pendingPreviewUrls.map((url, idx) => (
              <div
                key={`pending-${idx}`}
                className="relative h-20 w-20 overflow-hidden rounded-xl border border-gold/35 bg-black/40"
              >
                {isVideoFile(pendingFiles[idx]!) ? (
                  <video
                    src={url}
                    className="h-full w-full object-cover opacity-90"
                    muted
                    playsInline
                    aria-hidden
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover opacity-90" />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => onRemovePendingAt(idx)}
                  className="absolute right-1 top-1 rounded-md border border-white/25 bg-black/70 p-1 text-white transition hover:bg-red-500/80"
                  aria-label="Remove pending file"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
            {existingImages.length + pendingFiles.length < MAX_CATALOG_IMAGES ? (
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-gold/40 bg-gold/5 text-gold transition hover:border-gold/60 hover:bg-gold/10">
                <Plus className="h-7 w-7" strokeWidth={1.25} aria-hidden />
                <input
                  type="file"
                  accept="image/*,video/*,video/mp4,video/quicktime,.mp4,.mov,.webm,.mkv,.m4v,.avi"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    onPickCatalogImages(event.target.files);
                    event.target.value = "";
                  }}
                />
                <span className="sr-only">Add image or video</span>
              </label>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : editingId ? "Save changes" : "Create event"}
          </button>
        </div>
      </form>
    </AdminModal>
    </>
  );
}
