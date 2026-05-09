import { kml } from "@tmcw/togeojson";
import * as turf from "@turf/turf";
import type { FieldPolygon, Position } from "../algorithm/types";

/**
 * Parse a KML or GeoJSON file and extract polygon coordinates.
 *
 * Supports:
 * - KML with Polygon geometry (Google My Maps area export)
 * - KML with Point placemarks only (builds polygon from points via convex hull)
 * - GeoJSON with Polygon/MultiPolygon
 */
export function parseImportedFile(
  content: string,
  fileName: string,
): FieldPolygon {
  const ext = fileName.toLowerCase().split(".").pop();

  let geojson: GeoJSON.FeatureCollection;

  if (ext === "kml") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/xml");
    geojson = kml(doc) as GeoJSON.FeatureCollection;
  } else if (ext === "geojson" || ext === "json") {
    geojson = JSON.parse(content) as GeoJSON.FeatureCollection;
    // Handle single Feature or Geometry
    if ((geojson as unknown as GeoJSON.Feature).type === "Feature") {
      geojson = {
        type: "FeatureCollection",
        features: [geojson as unknown as GeoJSON.Feature],
      };
    }
    if (
      (geojson as unknown as GeoJSON.Geometry).type === "Polygon" ||
      (geojson as unknown as GeoJSON.Geometry).type === "MultiPolygon"
    ) {
      geojson = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: geojson as unknown as GeoJSON.Geometry,
          },
        ],
      };
    }
  } else {
    throw new Error(
      `未対応のファイル形式です: .${ext}\n対応形式: .kml, .geojson, .json`,
    );
  }

  // Collect polygons and points separately
  let polygonCoords: Position[] | null = null;
  const points: Position[] = [];

  for (const feature of geojson.features) {
    const geom = feature.geometry;
    if (!geom) continue;
    if (!polygonCoords) {
      if (geom.type === "Polygon") {
        polygonCoords = ensureClosed(geom.coordinates[0] as Position[]);
      } else if (geom.type === "MultiPolygon") {
        polygonCoords = ensureClosed(geom.coordinates[0][0] as Position[]);
      }
    }
    if (geom.type === "Point") {
      points.push(geom.coordinates.slice(0, 2) as Position);
    }
  }

  // If we have a polygon, use it. Any Point features become the entry point.
  if (polygonCoords) {
    const result: FieldPolygon = { coordinates: polygonCoords };
    if (points.length > 0) {
      result.entryPoint = points[0];
    }
    return result;
  }

  // No polygon found — build from points (need 3+ for polygon)
  if (points.length >= 3) {
    return buildPolygonFromPoints(points);
  }

  throw new Error(
    "ファイル内にポリゴンまたは3つ以上のポイントが見つかりませんでした。\n" +
      "Google マイマップでエリアを描画（またはポイントを3つ以上配置）してからKMLとしてエクスポートしてください。",
  );
}

/**
 * Build a polygon from a set of points using convex hull.
 * This handles the case where users place markers at field corners
 * in Google My Maps instead of drawing a polygon.
 */
function buildPolygonFromPoints(points: Position[]): FieldPolygon {
  const turfPoints = turf.featureCollection(
    points.map((p) => turf.point(p)),
  );
  const hull = turf.convex(turfPoints);

  if (hull) {
    const ring = hull.geometry.coordinates[0] as Position[];
    return { coordinates: ensureClosed(ring) };
  }

  // Convex hull failed (e.g. collinear points) — try ordering by angle from centroid
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  const sorted = [...points].sort(
    (a, b) =>
      Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx),
  );
  return { coordinates: ensureClosed(sorted) };
}

function ensureClosed(coords: Position[]): Position[] {
  if (coords.length < 3) throw new Error("ポリゴンには3つ以上の頂点が必要です");
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...coords, first];
  }
  return coords;
}

/**
 * Read a File object as text.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsText(file);
  });
}
