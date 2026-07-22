import { MediaPickControl } from "@/components/admin/media";
import { Modal } from "@/components/admin/overlays";
import { type FormEvent, type RefObject } from "react";
import { ChevronDown } from "lucide-react";
import type { ServiceTypeItem } from "@/features/admin/service-types/types/serviceTypes.types";
import ServicesFormPreview from "./ServicesFormPreview";

type Props = {
  isOpen: boolean;
  isSubmitting: boolean;
  isClearingMedia: boolean;
  editingId: string | null;
  canSubmit: boolean;
  serviceTypeId: string;
  setServiceTypeId: (id: string) => void;
  description: string;
  setDescription: (value: string) => void;
  itemsText: string;
  setItemsText: (value: string) => void;
  priceInput: string;
  setPriceInput: (value: string) => void;
  image: File | null;
  setImage: (file: File | null) => void;
  imagePreviewUrl: string | null;
  existingImageUrl: string | null;
  formPreviewMediaIsVideo: boolean;
  isTypeDropdownOpen: boolean;
  setIsTypeDropdownOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setIsPreviewLightboxOpen: (open: boolean) => void;
  activeServiceTypes: ServiceTypeItem[];
  selectedTypeName: string | undefined;
  mediaFileInputRef: RefObject<HTMLInputElement | null>;
  clearMediaFileInput: () => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRequestClearSavedMedia: () => void;
};

export default function ServicesFormModal({
  isOpen,
  isSubmitting,
  isClearingMedia,
  editingId,
  canSubmit,
  serviceTypeId,
  setServiceTypeId,
  description,
  setDescription,
  itemsText,
  setItemsText,
  priceInput,
  setPriceInput,
  image,
  setImage,
  imagePreviewUrl,
  existingImageUrl,
  formPreviewMediaIsVideo,
  isTypeDropdownOpen,
  setIsTypeDropdownOpen,
  setIsPreviewLightboxOpen,
  activeServiceTypes,
  selectedTypeName,
  mediaFileInputRef,
  clearMediaFileInput,
  onClose,
  onSubmit,
  onRequestClearSavedMedia,
}: Props) {
  return (
    <Modal title={editingId ? "Edit service" : "New service"} isOpen={isOpen} onClose={onClose}>
      <form id="service-form" noValidate onSubmit={onSubmit} className="space-y-6">
        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">SERVICE TYPE</span>
          <div className="relative mt-2">
            <button
              type="button"
              onClick={() => {
                if (activeServiceTypes.length === 0) return;
                setIsTypeDropdownOpen((prev) => !prev);
              }}
              className="shamell-glass-trigger flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm text-foreground"
            >
              <span className={selectedTypeName ? "text-foreground" : "text-foreground/55"}>
                {selectedTypeName ?? "Create a service type first"}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-gold/80 transition ${isTypeDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isTypeDropdownOpen && activeServiceTypes.length > 0 ? (
              <div className="shamell-scrollbar absolute left-0 top-14 z-40 max-h-56 w-full overflow-y-auto rounded-xl border border-gold/35 bg-[#0b0f14] p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
                {activeServiceTypes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setServiceTypeId(item.id);
                      setIsTypeDropdownOpen(false);
                    }}
                    className={`mb-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition last:mb-0 ${
                      item.id === serviceTypeId
                        ? "border border-gold/35 bg-gold/15 text-gold"
                        : "border border-transparent text-foreground/80 hover:border-gold/20 hover:bg-gold/10 hover:text-gold-light"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </label>

        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">DESCRIPCION</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
            placeholder="Describe the service..."
          />
        </label>

        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">ITEMS (UNO POR LINEA)</span>
          <p className="mt-1 font-body text-xs text-foreground/55">
            Example bullets on the site (weddings, yachts…). One line = one bullet in the public experience.
          </p>
          <textarea
            value={itemsText}
            onChange={(event) => setItemsText(event.target.value)}
            rows={5}
            className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
            placeholder={"Item 1\nItem 2\nItem 3"}
          />
        </label>

        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">PRECIO (OPCIONAL)</span>
          <input
            type="text"
            inputMode="decimal"
            value={priceInput}
            onChange={(event) => setPriceInput(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
            placeholder="e.g. 2500 or 2500.50"
          />
        </label>

        <div className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">IMAGEN O VIDEO</span>
          <MediaPickControl
            ref={mediaFileInputRef}
            onFileChange={(file) => setImage(file)}
            selectedFileName={image?.name ?? null}
            disabled={isSubmitting || isClearingMedia}
            aria-label="Select image or video for this service"
          />
        </div>

        <ServicesFormPreview
          imagePreviewUrl={imagePreviewUrl}
          existingImageUrl={existingImageUrl}
          formPreviewMediaIsVideo={formPreviewMediaIsVideo}
          editingId={editingId}
          hasSelectedFile={Boolean(image)}
          isSubmitting={isSubmitting}
          isClearingMedia={isClearingMedia}
          onRemoveSelectedFile={() => {
            setImage(null);
            setIsPreviewLightboxOpen(false);
            clearMediaFileInput();
          }}
          onRequestClearSavedMedia={onRequestClearSavedMedia}
          onOpenLightbox={() => setIsPreviewLightboxOpen(true)}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : editingId ? "Save changes" : "Create service"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
