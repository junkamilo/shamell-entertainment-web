import { describe, expect, it } from "vitest";
import {
  ASPECT_NARROW_MAX,
  ASPECT_WIDE_MIN,
  CAMERA_PRESET_ADMIN,
  CAMERA_PRESET_NARROW,
  CAMERA_PRESET_WIDE,
  CAMERA_PRESETS_BY_BUCKET,
  resolveAdminCameraPreset,
  resolveCameraPresetForAspect,
} from "./venueSceneConstants";

describe("venueSceneConstants camera helpers", () => {
  it("resolveCameraPresetForAspect picks narrow, wide, or bucket", () => {
    expect(resolveCameraPresetForAspect("laptop", ASPECT_NARROW_MAX - 0.01)).toEqual(
      CAMERA_PRESET_NARROW,
    );
    expect(resolveCameraPresetForAspect("laptop", ASPECT_WIDE_MIN + 0.01)).toEqual(
      CAMERA_PRESET_WIDE,
    );
    expect(resolveCameraPresetForAspect("laptop", 1.2)).toEqual(
      CAMERA_PRESETS_BY_BUCKET.laptop,
    );
  });

  it("resolveAdminCameraPreset branches on aspect", () => {
    expect(resolveAdminCameraPreset(2.1).fov).toBe(56);
    expect(resolveAdminCameraPreset(ASPECT_NARROW_MAX - 0.01).fov).toBe(58);
    expect(resolveAdminCameraPreset(1.2)).toEqual(CAMERA_PRESET_ADMIN);
  });
});
