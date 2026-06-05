# About Shamell hero video — performance checklist

Use this when investigating slow About video load on the home page (`#about`).

## Baseline measurement (Chrome DevTools)

1. Open the site home → Network tab (disable cache on first run).
2. Record:
   - `GET /api/v1/about` — TTFB and total time.
   - Poster `.jpg` from `res.cloudinary.com` — size and TTFB.
   - MP4 stream — `Content-Length`, TTFB, time to finish.
3. Note Cloudinary response headers: `cf-cache-status`, `x-cld-error` (if any).
4. In Performance, mark: API done → video request start → `canplay`.

### Targets

| Metric | Target |
|--------|--------|
| Poster visible | &lt; 1 s after section paint (with SSR or warm cache) |
| `canplay` | &lt; 3–5 s on Fast 3G; &lt; 2 s on WiFi/desktop |

## Cloudinary Media Library

- Folder: `shamell/about`
- Check: duration, resolution, original vs 720p MP4 size.
- After upload, `videoDeliveryUrl` / `videoPosterUrl` in DB should point to **eager** derivatives (no cold transcode on first visit).

## Recommended source file (admin)

- Length: **15–45 seconds** for the About loop.
- Format: MP4 (H.264) before upload when possible.
- Avoid multi-minute files for this slot; use a short loop or host a long-form video elsewhere.

## Re-warm CDN after deploy

Re-save About hero in admin (re-upload same file) or open the `videoDeliveryUrl` once in a browser to generate/cache the derivative.
