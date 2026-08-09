import {
  DEFAULT_FLOOR_SCENE_ZONES,
  mergeFloorSceneZones,
  normalizeFloorSceneZonesInput,
} from './floor-scene-zones.util';

describe('floor-scene-zones.util', () => {
  it('mergeFloorSceneZones returns defaults for null/invalid', () => {
    expect(mergeFloorSceneZones(null)).toEqual(DEFAULT_FLOOR_SCENE_ZONES);
    expect(mergeFloorSceneZones(undefined)).toEqual(DEFAULT_FLOOR_SCENE_ZONES);
  });

  it('mergeFloorSceneZones applies stage and derives carpet', () => {
    const merged = mergeFloorSceneZones({
      stage: { x: 5, z: 3, rotationY: 0.1 },
    });
    expect(merged.stage.x).toBe(5);
    expect(merged.stage.z).toBe(3);
    expect(merged.stage.rotationY).toBe(0.1);
    expect(merged.carpet.rotationY).toBe(0.1);
    expect(typeof merged.carpet.x).toBe('number');
  });

  it('normalizeFloorSceneZonesInput falls back when undefined', () => {
    expect(normalizeFloorSceneZonesInput(undefined)).toEqual(
      DEFAULT_FLOOR_SCENE_ZONES,
    );
  });
});
