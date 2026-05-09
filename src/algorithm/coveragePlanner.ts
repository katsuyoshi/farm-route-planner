import * as turf from "@turf/turf";
import type { FieldPolygon, PlannerConfig, RouteResult } from "./types";
import { pathDistance } from "./geometry";
import { generateSweepLines } from "./sweepLines";
import { clipAllLinesToPolygon } from "./clipToPolygon";
import { connectSwaths } from "./pathConnector";
import { findOptimalAngle } from "./angleOptimizer";
import { generateHeadlandPath, getInnerWorkArea } from "./headlandPath";

/**
 * Main entry point: compute the optimal coverage path for a field polygon.
 *
 * Route order: entryPoint → interior passes → headland laps → entryPoint
 */
export function planCoveragePath(
  field: FieldPolygon,
  config: PlannerConfig,
): RouteResult {
  // Build a turf polygon (ensure proper winding order)
  const polygon = turf.rewind(
    turf.polygon([field.coordinates]),
  ) as GeoJSON.Feature<GeoJSON.Polygon>;

  const entryPoint = field.entryPoint;

  // Compute inner work area (shrunk by headland laps * workingWidth)
  const workArea = getInnerWorkArea(
    polygon,
    config.headlandLaps,
    config.workingWidth,
  );

  // --- Interior (boustrophedon) passes ---
  let interiorPath: typeof field.coordinates = [];
  let flatSwaths: { start: typeof entryPoint & [number, number]; end: typeof entryPoint & [number, number] }[] = [];
  let optimalAngle = 0;

  if (workArea) {
    if (config.angleMode === "manual") {
      // Use user-specified angle directly
      optimalAngle = ((config.manualAngle % 180) + 180) % 180;
    } else {
      // Auto-optimize within the selected direction range
      const result = findOptimalAngle(workArea, config);
      optimalAngle = result.angle;
    }

    const lines = generateSweepLines(workArea, optimalAngle, config);
    const swathsByLine = clipAllLinesToPolygon(lines, workArea);
    interiorPath = connectSwaths(swathsByLine, entryPoint);
    flatSwaths = swathsByLine.flat();
  }

  const interiorDistance =
    interiorPath.length >= 2 ? pathDistance(interiorPath) : 0;

  // --- Headland (perimeter) laps ---
  const headlandStartFrom =
    interiorPath.length > 0
      ? interiorPath[interiorPath.length - 1]
      : entryPoint ?? null;

  const headlandResult = generateHeadlandPath(
    polygon,
    config.headlandLaps,
    config.workingWidth,
    headlandStartFrom,
    entryPoint ?? null,
  );
  const headlandPath = headlandResult.path;
  const headlandLapSizes = headlandResult.lapSizes;

  const headlandDistance =
    headlandPath.length >= 2 ? pathDistance(headlandPath) : 0;

  // --- Assemble full path ---
  const path = [...interiorPath, ...headlandPath];

  // Insert entry point at start and end if specified
  if (entryPoint) {
    if (path.length > 0) {
      path.unshift(entryPoint);
      path.push(entryPoint);
    }
  }

  const totalDistance = path.length >= 2 ? pathDistance(path) : 0;

  return {
    path,
    totalDistance,
    interiorDistance,
    headlandDistance,
    passCount: flatSwaths.length,
    optimalAngle,
    turnCount: Math.max(0, flatSwaths.length - 1),
    swaths: flatSwaths,
    headlandPath,
    headlandLapSizes,
    entryPoint,
  };
}
