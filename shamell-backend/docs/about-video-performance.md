# About Shamell hero video — performance checklist



Use this when investigating slow About video load on the home page (`#about`).



## Expected behavior (after lazy-load fix)



1. **SSR** preloads **poster JPG only** (not the full MP4).

2. **Poster or portrait fallback** is visible as soon as `#about` paints — no black box.

3. When the user scrolls within **~320px** of `#about`, the client **prefetches** the MP4 (`rel=prefetch`).

4. The `<video>` element mounts only when near viewport; **play** starts at 25% visibility.

5. `GET /api/v1/about` **auto-persists** `videoDeliveryUrl` / `videoPosterUrl` when missing (legacy rows).



## Baseline measurement (Chrome DevTools)



1. Open the site home → Network tab (disable cache on first run).

2. Record:

   - `GET /api/v1/about` — TTFB; confirm `videoDeliveryUrl` and `videoPosterUrl` are non-null in JSON.

   - Poster `.jpg` from `res.cloudinary.com` — size and TTFB.

   - MP4 stream — should start **after** scroll near `#about`, not on initial page load.

3. Note Cloudinary response headers: `cf-cache-status`, `x-cld-error` (if any).

4. In Performance, mark: section near → video request start → `canplay`.



### Targets



| Metric | Target |

|--------|--------|

| Poster / fallback visible | &lt; 1 s after `#about` paints |

| `canplay` (WiFi) | &lt; 3 s after video prefetch starts |

| `canplay` (Fast 3G) | &lt; 5 s after video prefetch starts |

| Initial page load | No full MP4 download before user nears About |



## Cloudinary Media Library



- Folder: `shamell/about`

- Check: duration, resolution, original vs 720p MP4 size.

- After upload, `videoDeliveryUrl` / `videoPosterUrl` in DB should point to **eager** derivatives.



## Backfill delivery URLs (legacy video)



If the hero was uploaded before delivery URL columns existed:



```bash

# Admin JWT required

POST /api/v1/about/admin/backfill-video-delivery?warm=1

```



Or:



```bash

ADMIN_ACCESS_TOKEN=<jwt> BACKEND_URL=https://api.example.com node scripts/backfill-about-video-delivery.mjs --warm

```



`GET /api/v1/about` also backfills missing URLs on the next public read.



## Recommended source file (admin)



- Length: **15–45 seconds** for the About loop.

- Format: MP4 (H.264) before upload when possible.

- Avoid multi-minute files for this slot.



## Re-warm CDN after deploy



Re-save About hero in admin (re-upload same file), run backfill with `?warm=1`, or open `videoDeliveryUrl` once in a browser to cache the derivative.



## QA regression



- [ ] Desktop WiFi: poster immediate at About; video fades in when ready.

- [ ] Fast 3G: no MP4 on initial load; acceptable delay after scroll.

- [ ] `prefers-reduced-motion`: poster/fallback only, no `<video>`.

- [ ] Poster 404: static portrait fallback (no black box).

- [ ] Second visit: faster `canplay` (CDN warm).

