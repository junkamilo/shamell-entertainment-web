export type BuildGalleryPhotoFormDataArgs = {
  categoryId: string;
  files: File[];
  editingId: string | null;
};

export function buildGalleryPhotoFormData({
  categoryId,
  files,
  editingId,
}: BuildGalleryPhotoFormDataArgs): FormData {
  const body = new FormData();
  body.append("categoryId", categoryId);
  if (editingId) {
    if (files[0]) body.append("media", files[0]);
  } else {
    for (const f of files) {
      body.append("media", f);
    }
  }
  return body;
}
