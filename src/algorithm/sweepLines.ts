import * as turf from "@turf/turf";
import type { PlannerConfig } from "./types";
import { metersToDegrees } from "./geometry";
import type { Feature, Polygon, LineString } from "geojson";

/**
 * Generate parallel sweep lines across a polygon at a given angle.
 *
 * Strategy:
 * 1. Rotate the polygon by -angle so lines align with horizontal axis
 * 2. Compute bounding box of rotated polygon
 * 3. Generate horizontal lines spaced by effective width
 * 4. Rotate lines back by +angle
 */
export function generateSweepLines(
  polygon: Feature<Polygon>,
  angleDeg: number,
  config: PlannerConfig,
): Feature<LineString>[] {
  const centroid = turf.centroid(polygon);
  const pivotCoord = centroid.geometry.coordinates as [number, number];

  // Rotate polygon to align sweep direction with horizontal
  const rotated = turf.transformRotate(polygon, -angleDeg, {
    pivot: pivotCoord,
  });
  const [minX, minY, maxX, maxY] = turf.bbox(rotated);

  // Convert working width from meters to degrees
  const lat = pivotCoord[1];
  const effectiveWidth =
    config.workingWidth * (1 - config.overlapRatio);
  const stepDeg = metersToDegrees(effectiveWidth, lat);

  if (stepDeg <= 0) return [];

  const lines: Feature<LineString>[] = [];
  const buffer = (maxX - minX) * 0.01; // small buffer to ensure full intersection

  let y = minY + stepDeg / 2;
  while (y <= maxY) {
    // Create horizontal line across the full width
    const line = turf.lineString([
      [minX - buffer, y],
      [maxX + buffer, y],
    ]);
    // Rotate back to original orientation
    const rotatedLine = turf.transformRotate(line, angleDeg, {
      pivot: pivotCoord,
    });
    lines.push(rotatedLine);
    y += stepDeg;
  }

  return lines;
}
