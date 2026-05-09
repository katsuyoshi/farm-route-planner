import * as turf from "@turf/turf";
import { useMemo } from "react";
import type { Position, RouteResult } from "../algorithm/types";
import type { GpsState } from "../hooks/useGpsTracking";

interface GpsPanelProps {
  gps: GpsState;
  route: RouteResult | null;
  followMode: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onToggleFollow: () => void;
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

export function GpsPanel({
  gps,
  route,
  followMode,
  onStartTracking,
  onStopTracking,
  onToggleFollow,
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
    </div>
  );
}
