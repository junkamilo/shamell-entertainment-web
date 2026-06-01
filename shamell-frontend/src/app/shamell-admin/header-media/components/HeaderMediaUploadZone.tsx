import { type RefObject } from "react";
import { AdminMediaUploadIconButton } from "@/components/admin/AdminMediaUploadIconButton";

type Props = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFilesChange: (files: File[]) => void;
};

export default function HeaderMediaUploadZone({ fileInputRef, onFilesChange }: Props) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="font-brand text-[11px] tracking-[0.2em] text-gold/90">01 — UPLOAD MEDIA</p>
      <AdminMediaUploadIconButton
        ref={fileInputRef}
        multiple
        iconVariant="cloud-upload"
        aria-label="Upload images or videos"
        onFilesChange={onFilesChange}
      />
    </div>
  );
}
