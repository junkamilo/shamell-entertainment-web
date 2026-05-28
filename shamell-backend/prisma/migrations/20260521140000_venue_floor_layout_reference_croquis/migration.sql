-- Apply reference croquis dimensions; clear saved furniture so the PNG plan shows by default.
DELETE FROM "venue_floor_layouts";

ALTER TABLE "venue_floor_layouts" ALTER COLUMN "viewBoxWidth" SET DEFAULT 1024;
ALTER TABLE "venue_floor_layouts" ALTER COLUMN "viewBoxHeight" SET DEFAULT 944;
