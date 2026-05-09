import * as turf from "@turf/turf";
import { useMemo } from "react";
import type { Position, RouteResult } from "../algorithm/types";
import type { GpsState } from "../hooks/useGpsTracking";

interface GpsPanelProps {
  gps: GpsState;
  route: RouteResult | null;
  followMode: boolean;
  polygonCoords?: Position[];
  onStartTracking: () => void;
  onStopTracking: () => void;
  onToggleFollow: () => void;
  onCalibrate: (target: Position) => void;
  onNudge: (dir: "north" | "south" | "east" | "west", meters: number) => void;
  onResetOffset: () => void;
}

function formatMeters(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${Math.round(m)} m`;
}

/** Find the nearest point on the route path and compute distance + progress */
function computeGuidance(
  position: Position,
  route: RouteResult,
): { distToRoute: number; progress: number; nearestIdx: number } | null {
  if (route.path.length < 2) return null;

  const pt = turf.point(position);
  const line = turf.lineString(route.path);
  const snapped = turf.nearestPointOnLine(line, pt, { units: "meters" });

  const distToRoute = snapped.properties.dist ?? 0;

  // Progress: fraction of total path length to the nearest point
  const nearestIdx = snapped.properties.index ?? 0;
  let distAlongPath = 0;
  for (let i = 0; i < nearestIdx && i + 1 < route.path.length; i++) {
    distAlongPath += turf.distance(
      turf.point(route.path[i]),
      turf.point(route.path[i + 1]),
      { units: "meters" },
    );
  }
  const progress =
    route.totalDistance > 0 ? (distAlongPath / route.totalDistance) * 100 : 0;

  return { distToRoute, progress, nearestIdx };
}

/** Find the nearest polygon vertex to the given position */
function findNearestCorner(
  position: Position,
  coords: Position[],
): Position | null {
  if (coords.length === 0) return null;
  // Exclude the closing vertex (same as first)
  const vertices =
    coords.length > 1 &&
    coords[0][0] === coords[coords.length - 1][0] &&
    coords[0][1] === coords[coords.length - 1][1]
      ? coords.slice(0, -1)
      : coords;

  let best: Position = vertices[0];
  let bestDist = Infinity;
  const pt = turf.point(position);
  for (const v of vertices) {
    const d = turf.distance(pt, turf.point(v), { units: "meters" });
    if (d < bestDist) {
      bestDist = d;
      best = v;
    }
  }
  return best;
}

export function GpsPanel({
  gps,
  route,
  followMode,
  polygonCoords,
  onStartTracking,
  onStopTracking,
  onToggleFollow,
  onCalibrate,
  onNudge,
  onResetOffset,
}: GpsPanelProps) {
  const guidance = useMemo(() => {
    if (!gps.position || !route) return null;
    return computeGuidance(gps.position, route);
  }, [gps.position, route]);

  return (
    <div className="gps-panel">
      <h2>GPS ナビゲーション</h2>

      <div className="gps-controls">
        {!gps.isTracking ? (
          <button className="btn btn-gps-start" onClick={onStartTracking}>
            GPS 開始
          </button>
        ) : (
          <button className="btn btn-gps-stop" onClick={onStopTracking}>
            GPS 停止
          </button>
        )}
        {gps.isTracking && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={followMode}
              onChange={onToggleFollow}
            />
            現在地を追従
          </label>
        )}
      </div>

      {gps.error && <p className="gps-error">{gps.error}</p>}

      {gps.isTracking && gps.position && (
        <dl className="gps-info">
          <dt>精度</dt>
          <dd>{gps.accuracy != null ? `${Math.round(gps.accuracy)} m` : "—"}</dd>

          {guidance && route && (
            <>
              <dt>ルートまでの距離</dt>
              <dd
                className={
                  guidance.distToRoute > 5 ? "gps-off-route" : "gps-on-route"
                }
              >
                {formatMeters(guidance.distToRoute)}
              </dd>
              <dt>進捗</dt>
              <dd>{guidance.progress.toFixed(1)}%</dd>
            </>
          )}
        </dl>
      )}

      {gps.isTracking && gps.position && guidance && guidance.distToRoute > 5 && (
        <p className="gps-warning">ルートから離れています</p>
      )}

      {/* GPS offset controls */}
      {gps.isTracking && gps.position && (
        <div className="gps-offset">
          <h3>位置補正</h3>
          {polygonCoords && polygonCoords.length >= 3 && gps.rawPosition && (
            <button
              className="btn btn-gps-calibrate"
              onClick={() => {
                const corner = findNearestCorner(gps.rawPosition!, polygonCoords);
                if (corner) onCalibrate(corner);
              }}
            >
              最寄りの角に合わせる
            </button>
          )}
          <div className="gps-nudge">
            <div className="gps-nudge-row">
              <button className="btn-nudge" onClick={() => onNudge("north", 1)}>
                N 1m
              </button>
            </div>
            <div className="gps-nudge-row">
              <button className="btn-nudge" onClick={() => onNudge("west", 1)}>
                W 1m
              </button>
              <button className="btn-nudge btn-nudge-reset" onClick={onResetOffset}>
                reset
              </button>
              <button className="btn-nudge" onClick={() => onNudge("east", 1)}>
                E 1m
              </button>
            </div>
            <div className="gps-nudge-row">
              <button className="btn-nudge" onClick={() => onNudge("south", 1)}>
                S 1m
              </button>
            </div>
          </div>
          {(gps.offset[0] !== 0 || gps.offset[1] !== 0) && (
            <p className="gps-offset-info">
              補正中: E{(gps.offset[0] * 111320 * Math.cos(((gps.rawPosition?.[1] ?? 39) * Math.PI) / 180)).toFixed(1)}m,
              N{(gps.offset[1] * 110574).toFixed(1)}m
            </p>
          )}
        </div>
      )}
    </div>
  );
}
