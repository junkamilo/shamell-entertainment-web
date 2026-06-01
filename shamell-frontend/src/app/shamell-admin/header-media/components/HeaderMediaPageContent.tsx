"use client";

import { useState } from "react";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminMediaPreviewModal from "@/components/admin/AdminMediaPreviewModal";
import { useAdminMediaPreview } from "@/components/admin/useAdminMediaPreview";
import { cn } from "@/lib/utils";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { headerLibraryItemIsVideo } from "../lib/headerMediaUtils";
import type { HeaderPhoto } from "../types/headerMedia.types";
import type { HeaderMediaSectionTab } from "@/lib/headerTextTypes";
import { useHeaderTextSection } from "../hooks/useHeaderTextSection";
import type { useHeaderMediaPage } from "../hooks/useHeaderMediaPage";
import AdminDeleteConfirmModal from "@/components/admin/AdminDeleteConfirmModal";
import HeaderMediaFocusEditor from "./HeaderMediaFocusEditor";
import HeaderMediaLibrarySection from "./HeaderMediaLibrarySection";
import HeaderMediaPendingQueue from "./HeaderMediaPendingQueue";
import HeaderMediaSectionTabs from "./HeaderMediaSectionTabs";
import HeaderMediaUploadZone from "./HeaderMediaUploadZone";
import HeaderTextSection from "./HeaderTextSection";
import SectionGoldDivider from "./SectionGoldDivider";

type PageState = ReturnType<typeof useHeaderMediaPage>;

type Props = {
  state: PageState;
};

export default function HeaderMediaPageContent({ state }: Props) {
  const { library, upload, focus } = state;
  const textSection = useHeaderTextSection();
  const mediaPreview = useAdminMediaPreview();
  const [activeTab, setActiveTab] = useState<HeaderMediaSectionTab>("media");

  const openHeaderMediaPreview = (photo: HeaderPhoto, index: number) => {
    mediaPreview.openPreview({
      src: photo.imageUrl,
      title: `Header media #${index}`,
      mediaType: headerLibraryItemIsVideo(photo) ? "VIDEO" : "IMAGE",
    });
  };

  const heroAction =
    activeTab === "media"
      ? { label: "Upload media", onAction: upload.onPickFiles }
      : { label: "Edit text", onAction: textSection.openEditModal };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminBackButton href="/shamell-admin" label="Back" className="mb-4" />

      <AdminModuleHero
        title="Main header"
        actionLabel={heroAction.label}
        onAction={heroAction.onAction}
        bordered={false}
      />

      <HeaderMediaSectionTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "media" ? (
        <section
          className={cn(
            "shamell-glass-surface rounded-2xl border border-gold/15 p-5 transition md:p-6",
            upload.dragOver && "ring-2 ring-gold/20",
          )}
          onDragOver={upload.onDropzoneDragOver}
          onDragLeave={upload.onDropzoneDragLeave}
          onDrop={upload.onDropzoneDrop}
        >
          <HeaderMediaUploadZone
            fileInputRef={upload.fileInputRef}
            onFilesChange={upload.mergeFiles}
          />

          <HeaderMediaLibrarySection
            isLoading={library.isLoading}
            photos={library.photos}
            pagedPhotos={library.pagedPhotos}
            paginationMeta={library.paginationMeta}
            onPageChange={library.setPage}
            onPerPageChange={library.onPerPageChange}
            onView={openHeaderMediaPreview}
            onFocus={focus.openFocusEditor}
            onToggle={(photo) => void state.onToggle(photo)}
            onDelete={state.openDeleteConfirm}
          />

          {upload.pendingFiles.length > 0 ? (
            <>
              <SectionGoldDivider />
              <HeaderMediaPendingQueue
                pendingFiles={upload.pendingFiles}
                pendingPreviews={upload.pendingPreviews}
                pendingTotalBytes={upload.pendingTotalBytes}
                formatFileSize={upload.formatFileSize}
                isSaving={state.isSaving}
                onSubmit={state.onSubmit}
                onPickFiles={upload.onPickFiles}
                onClearPending={upload.clearPending}
                onRemovePendingOne={upload.removePendingOne}
              />
            </>
          ) : null}
        </section>
      ) : (
        <HeaderTextSection state={textSection} />
      )}

      <HeaderMediaFocusEditor
        editingFocusPhoto={focus.editingFocusPhoto}
        focusDraft={focus.focusDraft}
        setFocusDraft={focus.setFocusDraft}
        focusEditorIsVideo={focus.focusEditorIsVideo}
        isSavingFocus={focus.isSavingFocus}
        onClose={focus.closeFocusEditor}
        onSetDraftFromPoint={focus.setDraftFromPoint}
        onSave={() => void focus.saveFocusEditor()}
      />

      <AdminDeleteConfirmModal
        title="Remove header media"
        isOpen={Boolean(state.pendingDelete)}
        isDeleting={state.isDeleting}
        onClose={state.closeDeleteModal}
        onConfirm={() => void state.onConfirmDelete()}
      >
        <p>
          Permanently remove this{" "}
          {state.pendingDelete && headerLibraryItemIsVideo(state.pendingDelete) ? "video" : "image"}{" "}
          from the main header? You will not be able to recover it.
        </p>
      </AdminDeleteConfirmModal>

      <AdminMediaPreviewModal
        isOpen={mediaPreview.isPreviewOpen}
        onClose={mediaPreview.closePreview}
        src={mediaPreview.preview?.src ?? ""}
        title={mediaPreview.preview?.title}
        mediaType={mediaPreview.preview?.mediaType}
      />
    </div>
  );
}
