import { Polyline, CircleMarker, Tooltip } from "react-leaflet";
import type { RouteResult, Position } from "../algorithm/types";
import type { LatLngExpression } from "leaflet";
import { ArrowOverlay } from "./ArrowOverlay";

interface RouteDisplayProps {
  route: RouteResult | null;
  currentPass: number | null;
}

/** Return color/weight/opacity based on sequential number vs currentPass */
function trackingStyle(
  seqNum: number,
  currentPass: number | null,
  defaultColor: string,
  defaultWeight: number,
  defaultOpacity: number,
) {
  if (currentPass === null) {
    return { color: defaultColor, weight: defaultWeight, opacity: defaultOpacity };
  }
  if (seqNum < currentPass) {
    return { color: "#9ca3af", weight: defaultWeight, opacity: 0.5 };
  }
  if (seqNum === currentPass) {
    return { color: "#f59e0b", weight: 5, opacity: 1.0 };
  }
  return { color: defaultColor, weight: defaultWeight, opacity: defaultOpacity };
}

/** Convert [lng, lat] to [lat, lng] for Leaflet */
function toLatLng(pos: Position): LatLngExpression {
  return [pos[1], pos[0]];
}

/**
 * Separate the interior path into pass segments and turn segments.
 * Path alternates: pass (swath), turn (connection), pass, turn, ...
 */
function separateInteriorSegments(path: Position[]): {
  passes: LatLngExpression[][];
  turns: LatLngExpression[][];
} {
  const passes: LatLngExpression[][] = [];
  const turns: LatLngExpression[][] = [];

  for (let i = 0; i + 1 < path.length; i += 2) {
    passes.push([toLatLng(path[i]), toLatLng(path[i + 1])]);

    if (i + 2 < path.length) {
      turns.push([toLatLng(path[i + 1]), toLatLng(path[i + 2])]);
    }
  }

  return { passes, turns };
}

/**
 * Separate headland path into individual lap segments and transit segments
 * using the known lap sizes from the algorithm.
 */
function separateHeadlandSegments(
  path: Position[],
  lapSizes: number[],
): {
  laps: LatLngExpression[][];
  transits: LatLngExpression[][];
} {
  const laps: LatLngExpression[][] = [];
  const transits: LatLngExpression[][] = [];

  let offset = 0;
  for (let li = 0; li < lapSizes.length; li++) {
    const size = lapSizes[li];
    laps.push(path.slice(offset, offset + size).map(toLatLng));

    const lapEnd = offset + size - 1;
    const nextStart = offset + size;
    // Transit from end of this lap to start of next lap
    if (nextStart < path.length) {
      transits.push([toLatLng(path[lapEnd]), toLatLng(path[nextStart])]);
    }
    offset += size;
  }

  return { laps, transits };
}

export function RouteDisplay({ route, currentPass }: RouteDisplayProps) {
  if (!route || route.path.length < 2) return null;

  // Interior path = full path minus headland portion
  const interiorLen = route.path.length - route.headlandPath.length;
  const interiorPath = route.path.slice(
    route.entryPoint ? 1 : 0,
    route.entryPoint ? interiorLen - 1 : interiorLen,
  );

  const { passes, turns } = separateInteriorSegments(interiorPath);

  // Separate headland path into laps and transits
  const { laps: headlandLaps, transits: headlandTransits } =
    separateHeadlandSegments(route.headlandPath, route.headlandLapSizes);

  const startPos = toLatLng(route.path[0]);
  const endPos = toLatLng(route.path[route.path.length - 1]);

  return (
    <>
      {/* Interior passes */}
      {passes.map((seg, i) => {
        const seqNum = i + 1;
        const style = trackingStyle(seqNum, currentPass, "#2563eb", 3, 0.8);
        return (
          <Polyline
            key={`pass-${i}`}
            positions={seg}
            pathOptions={style}
          >
            <Tooltip permanent direction="center" className="pass-label">
              {seqNum}
            </Tooltip>
          </Polyline>
        );
      })}
      {/* Interior turns */}
      {turns.map((seg, i) => (
        <Polyline
          key={`turn-${i}`}
          positions={seg}
          color="#dc2626"
          weight={2}
          opacity={0.6}
          dashArray="6,4"
        />
      ))}
      {/* Headland laps (working) */}
      {headlandLaps.map((seg, i) => {
        const seqNum = passes.length + i + 1;
        const style = trackingStyle(seqNum, currentPass, "#059669", 3, 0.7);
        return (
          <Polyline
            key={`hlap-${i}`}
            positions={seg}
            pathOptions={style}
          >
            <Tooltip permanent direction="center" className="pass-label headland-label">
              {seqNum}
            </Tooltip>
          </Polyline>
        );
      })}
      {/* Headland transits (空移動) */}
      {headlandTransits.map((seg, i) => (
        <Polyline
          key={`htransit-${i}`}
          positions={seg}
          color="#f59e0b"
          weight={2}
          opacity={0.7}
          dashArray="6,4"
        />
      ))}
      {/* Direction arrows */}
      <ArrowOverlay path={route.path} headlandPath={route.headlandPath} />
      {/* Entry point marker (outer ring) */}
      {route.entryPoint && (
        <CircleMarker
          center={toLatLng(route.entryPoint)}
          radius={10}
          color="#9333ea"
          fillColor="#a855f7"
          fillOpacity={0.3}
          weight={3}
        />
      )}
      {/* Start marker */}
      <CircleMarker
        center={startPos}
        radius={7}
        color="#16a34a"
        fillColor="#22c55e"
        fillOpacity={1}
      />
      {/* End marker */}
      <CircleMarker
        center={endPos}
        radius={7}
        color="#dc2626"
        fillColor="#ef4444"
        fillOpacity={1}
      />
    </>
  );
}
