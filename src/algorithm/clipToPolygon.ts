import * as turf from "@turf/turf";
import type { Position, Swath } from "./types";
import { midpoint, sortPointsAlongDirection } from "./geometry";
import type { Feature, Polygon, LineString } from "geojson";

/**
 * Clip a sweep line to a polygon boundary.
 * Returns segments (swaths) that lie inside the polygon.
 *
 * For concave polygons, a single line can produce multiple segments.
 */
export function clipLineToPolygon(
  line: Feature<LineString>,
  polygon: Feature<Polygon>,
): Swath[] {
  const intersections = turf.lineIntersect(line, polygon);
  if (intersections.features.length < 2) return [];

  // Extract intersection points
  const points = intersections.features.map(
    (f) => f.geometry.coordinates as Position,
  );

  // Compute line direction for sorting
  const coords = line.geometry.coordinates;
  const direction: Position = [
    coords[1][0] - coords[0][0],
    coords[1][1] - coords[0][1],
  ];

  // Sort intersection points along the line direction
  const sorted = sortPointsAlongDirection(points, direction);

  // Pair consecutive points (enter/exit polygon)
  const swaths: Swath[] = [];
  for (let i = 0; i + 1 < sorted.length; i += 2) {
    const start = sorted[i];
    const end = sorted[i + 1];
    const mid = midpoint(start, end);

    // Verify midpoint is inside the polygon
    if (turf.booleanPointInPolygon(turf.point(mid), polygon)) {
      swaths.push({ start, end });
    }
  }

  return swaths;
}

/**
 * Clip all sweep lines to a polygon, returning swaths grouped by line index.
 */
export function clipAllLinesToPolygon(
  lines: Feature<LineString>[],
  polygon: Feature<Polygon>,
): Swath[][] {
  return lines.map((line) => clipLineToPolygon(line, polygon));
}
