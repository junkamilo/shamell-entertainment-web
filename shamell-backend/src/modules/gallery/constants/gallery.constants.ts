/** Album for general uploads; excluded from public category tabs (aggregate "All" still lists these photos). */
export const GALLERY_CATCHALL_SLUG = 'gallery-all';

/** Max files per POST /gallery/admin/photos (memoryStorage — keep moderate). */
export const GALLERY_UPLOAD_MAX_FILES = 20;

/** Cloudinary folder for gallery uploads. */
export const GALLERY_CLOUDINARY_FOLDER = 'shamell/gallery';

/** Default category slug for event catalog images. */
export const EVENT_CATALOG_GALLERY_SLUG_DEFAULT = 'event-catalog';

/** Env override: explicit gallery category UUID for event images. */
export const EVENT_CATALOG_GALLERY_CATEGORY_ID_ENV =
  'EVENT_CATALOG_GALLERY_CATEGORY_ID';

/** Env override: gallery category slug for event images. */
export const EVENT_CATALOG_GALLERY_SLUG_ENV = 'EVENT_CATALOG_GALLERY_SLUG';

/** Max bytes per uploaded media file (multer). */
export const GALLERY_UPLOAD_MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
