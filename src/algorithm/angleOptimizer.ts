import type { PlannerConfig, AngleMode } from "./types";
import { pathDistance } from "./geometry";
import { generateSweepLines } from "./sweepLines";
import { clipAllLinesToPolygon } from "./clipToPolygon";
import { connectSwaths } from "./pathConnector";
import type { Feature, Polygon } from "geojson";

export interface AngleResult {
  angle: number;
  distance: number;
}

/**
 * Generate candidate angles based on mode and step size.
 *
 * - auto:        0 ~ 179° (全方向)
 * - east-west:   0 ~ 45° + 135 ~ 179° (東西寄り)
 * - north-south: 45 ~ 135° (南北寄り)
 */
export function getCandidateAngles(
  mode: AngleMode,
  step: number,
): number[] {
  const angles: number[] = [];

  switch (mode) {
    case "east-west":
      for (let a = 0; a <= 45; a += step) angles.push(a);
      for (let a = 135; a < 180; a += step) angles.push(a);
      break;
    case "north-south":
      for (let a = 45; a <= 135; a += step) angles.push(a);
      break;
    case "auto":
    default:
      for (let a = 0; a < 180; a += step) angles.push(a);
      break;
  }

  return angles;
}

/**
 * Find the optimal sweep angle that minimizes total travel distance.
 *
 * If candidateAngles is provided, only those angles are tested.
 * Otherwise, generates candidates from 0 to 179° with config.angleStep.
 */
export function findOptimalAngle(
  polygon: Feature<Polygon>,
  config: PlannerConfig,
  candidateAngles?: number[],
): AngleResult {
  const angles =
    candidateAngles ?? getCandidateAngles(config.angleMode, config.angleStep);

  let bestAngle = angles[0] ?? 0;
  let bestDistance = Infinity;

  for (const angle of angles) {
    const lines = generateSweepLines(polygon, angle, config);
    const swathsByLine = clipAllLinesToPolygon(lines, polygon);
    const path = connectSwaths(swathsByLine);

    if (path.length < 2) continue;

    const distance = pathDistance(path);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestAngle = angle;
    }
  }

  return { angle: bestAngle, distance: bestDistance };
}
