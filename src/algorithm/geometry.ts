import * as turf from "@turf/turf";
import type { Position } from "./types";

/**
 * Convert meters to approximate degrees at a given latitude.
 * For small distances (rice paddies), linear approximation is sufficient.
 */
export function metersToDegrees(
  meters: number,
  latitudeDeg: number,
): number {
  return meters / (111320 * Math.cos((latitudeDeg * Math.PI) / 180));
}

/**
 * Compute the total distance of a path in meters.
 */
export function pathDistance(path: Position[]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += turf.distance(turf.point(path[i]), turf.point(path[i + 1]), {
      units: "meters",
    });
  }
  return total;
}

/**
 * Sort points by their projection onto a line defined by direction vector.
 * Returns sorted copies (does not mutate input).
 */
export function sortPointsAlongDirection(
  points: Position[],
  direction: Position,
): Position[] {
  const [dx, dy] = direction;
  return [...points].sort((a, b) => {
    const projA = a[0] * dx + a[1] * dy;
    const projB = b[0] * dx + b[1] * dy;
    return projA - projB;
  });
}

/**
 * Midpoint of two positions.
 */
export function midpoint(a: Position, b: Position): Position {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/**
 * Squared Euclidean distance (for fast comparisons without sqrt).
 */
export function distSq(a: Position, b: Position): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}
