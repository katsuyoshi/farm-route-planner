import * as turf from "@turf/turf";
import type { Position } from "./types";
import { distSq } from "./geometry";
import type { Feature, Polygon } from "geojson";

/**
 * Generate headland (perimeter) laps around the field.
 *
 * Creates N offset rings, each shrunk inward by workingWidth * i.
 * Returns paths ordered from innermost to outermost ring,
 * so the machine finishes on the outermost perimeter.
 *
 * The last ring is rotated so it ends at the point nearest to `entryPoint`,
 * ensuring the machine finishes close to the exit.
 */
export function generateHeadlandPath(
  polygon: Feature<Polygon>,
  laps: number,
  workingWidth: number,
  startFrom: Position | null,
  entryPoint: Position | null,
): { path: Position[]; lapSizes: number[] } {
  if (laps <= 0) return { path: [], lapSizes: [] };

  const rings: Position[][] = [];

  for (let i = laps; i >= 1; i--) {
    const offsetKm = (-workingWidth * i + workingWidth / 2) / 1000;
    const buffered = turf.buffer(polygon, offsetKm, { units: "kilometers" });

    if (!buffered) continue;

    let ring: Position[];
    if (buffered.geometry.type === "Polygon") {
      ring = buffered.geometry.coordinates[0] as Position[];
    } else if (buffered.geometry.type === "MultiPolygon") {
      ring = buffered.geometry.coordinates[0][0] as Position[];
    } else {
      continue;
    }

    if (ring.length < 4) continue;
    rings.push(ring);
  }

  if (rings.length === 0) return { path: [], lapSizes: [] };

  // Connect rings into a continuous path
  const path: Position[] = [];
  const lapSizes: number[] = [];
  let currentPos = startFrom;

  for (let ri = 0; ri < rings.length; ri++) {
    const ring = rings[ri];
    const isLastRing = ri === rings.length - 1;

    let rotated: Position[];
    if (isLastRing && entryPoint) {
      rotated = rotateRingToEndAt(ring, entryPoint);
    } else {
      rotated = rotateRingToNearest(ring, currentPos);
    }

    lapSizes.push(rotated.length);
    for (const p of rotated) {
      path.push(p);
    }
    currentPos = path[path.length - 1];
  }

  return { path, lapSizes };
}

/**
 * Rotate a closed ring so it starts at the vertex nearest to `target`.
 * The ring remains closed (first === last).
 */
function rotateRingToNearest(
  ring: Position[],
  target: Position | null,
): Position[] {
  if (!target || ring.length < 4) return ring;

  const coords = ring.slice(0, -1);
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < coords.length; i++) {
    const d = distSq(coords[i], target);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  const rotated = [...coords.slice(bestIdx), ...coords.slice(0, bestIdx)];
  rotated.push(rotated[0]);
  return rotated;
}

/**
 * Rotate a closed ring so the last point before closing is nearest to `target`.
 * This means the ring traversal ends at the point closest to the entry.
 */
function rotateRingToEndAt(
  ring: Position[],
  target: Position,
): Position[] {
  if (ring.length < 4) return ring;

  const coords = ring.slice(0, -1);
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < coords.length; i++) {
    const d = distSq(coords[i], target);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  // Start one vertex AFTER the closest point, so the traversal
  // reaches the closest point as its last vertex before closing.
  const startIdx = (bestIdx + 1) % coords.length;
  const rotated = [...coords.slice(startIdx), ...coords.slice(0, startIdx)];
  rotated.push(rotated[0]);
  return rotated;
}

/**
 * Compute the inner working area polygon after reserving headland laps.
 */
export function getInnerWorkArea(
  polygon: Feature<Polygon>,
  laps: number,
  workingWidth: number,
): Feature<Polygon> | null {
  if (laps <= 0) return polygon;

  const offsetKm = (-workingWidth * laps) / 1000;
  const buffered = turf.buffer(polygon, offsetKm, { units: "kilometers" });

  if (!buffered) return null;
  if (buffered.geometry.type === "Polygon") {
    return buffered as Feature<Polygon>;
  }
  if (buffered.geometry.type === "MultiPolygon") {
    return turf.polygon(
      buffered.geometry.coordinates[0],
    ) as Feature<Polygon>;
  }
  return null;
}
