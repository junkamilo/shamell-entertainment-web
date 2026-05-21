import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import type { useHeaderMediaPage } from "../hooks/useHeaderMediaPage";
import HeaderMediaDeleteModal from "./HeaderMediaDeleteModal";
import HeaderMediaFocusEditor from "./HeaderMediaFocusEditor";
import HeaderMediaLibrarySection from "./HeaderMediaLibrarySection";
import HeaderMediaPendingQueue from "./HeaderMediaPendingQueue";
import HeaderMediaUploadZone from "./HeaderMediaUploadZone";
import SectionGoldDivider from "./SectionGoldDivider";

type PageState = ReturnType<typeof useHeaderMediaPage>;

type Props = {
  state: PageState;
};

export default function HeaderMediaPageContent({ state }: Props) {
  const { library, upload, focus } = state;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminBackButton href="/shamell-admin" label="Back" className="mb-4" />

      <AdminModuleHero
        title="Main header"
        actionLabel="Upload media"
        onAction={upload.onPickFiles}
        bordered={false}
      />

      <section className="shamell-glass-surface rounded-2xl border border-gold/15 p-5 md:p-6">
        <HeaderMediaUploadZone
          fileInputRef={upload.fileInputRef}
          dragOver={upload.dragOver}
          onPickFiles={upload.onPickFiles}
          onInputChange={upload.onInputChange}
          onDropzoneDragOver={upload.onDropzoneDragOver}
          onDropzoneDragLeave={upload.onDropzoneDragLeave}
          onDropzoneDrop={upload.onDropzoneDrop}
        />

        <HeaderMediaLibrarySection
          isLoading={library.isLoading}
          photos={library.photos}
          pagedPhotos={library.pagedPhotos}
          paginationMeta={library.paginationMeta}
          onPageChange={library.setPage}
          onPerPageChange={library.onPerPageChange}
          onView={(url) => window.open(url, "_blank", "noopener,noreferrer")}
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

      <HeaderMediaDeleteModal
        pendingDelete={state.pendingDelete}
        isDeleting={state.isDeleting}
        onClose={state.closeDeleteModal}
        onConfirm={() => void state.onConfirmDelete()}
      />
    </div>
  );
}
