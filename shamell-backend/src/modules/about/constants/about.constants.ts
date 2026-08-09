/** Cloudinary eager transforms applied at About hero video upload. */
export const ABOUT_VIDEO_EAGER_STREAM = {
  width: 720,
  crop: 'limit',
  quality: 'auto:eco',
  video_codec: 'h264',
  fetch_format: 'mp4',
} as const;

export const ABOUT_VIDEO_EAGER_POSTER = {
  width: 720,
  crop: 'limit',
  quality: 'auto',
  format: 'jpg',
  start_offset: '0',
} as const;

export const ABOUT_VIDEO_UPLOAD_EAGER = [
  ABOUT_VIDEO_EAGER_STREAM,
  ABOUT_VIDEO_EAGER_POSTER,
];

export const ABOUT_VIDEO_UPLOAD_MARKER = '/video/upload/';
export const ABOUT_VIDEO_STREAM_TRANSFORM =
  'q_auto:eco,vc_h264,w_720,c_limit,f_mp4';
export const ABOUT_VIDEO_POSTER_TRANSFORM = 'so_0,w_720,c_limit,q_auto,f_jpg';
export const ABOUT_CLOUDINARY_FOLDER = 'shamell/about';
