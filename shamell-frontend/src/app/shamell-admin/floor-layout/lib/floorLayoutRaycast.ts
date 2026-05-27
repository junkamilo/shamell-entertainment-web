import * as THREE from "three";
import { worldToLayout } from "@/components/venue-3d/layoutCoords3d";
import { WORLD_DEPTH, WORLD_WIDTH } from "@/components/venue-3d/venueSceneConstants";

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3();

export function pickFloorFromClient(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
  viewBoxWidth: number,
  viewBoxHeight: number,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);

  const target = raycaster.ray.intersectPlane(plane, hit);
  if (!target) return null;

  const wx = Math.max(0, Math.min(WORLD_WIDTH, hit.x));
  const wz = Math.max(0, Math.min(WORLD_DEPTH, hit.z));
  return worldToLayout(wx, wz, viewBoxWidth, viewBoxHeight);
}

export function pickWorldFromClient(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
): { x: number; z: number } | null {
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);

  const target = raycaster.ray.intersectPlane(plane, hit);
  if (!target) return null;
  return {
    x: Math.max(0, Math.min(WORLD_WIDTH, hit.x)),
    z: Math.max(0, Math.min(WORLD_DEPTH, hit.z)),
  };
}
