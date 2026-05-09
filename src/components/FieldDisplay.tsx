import { useEffect } from "react";
import { Polygon as LeafletPolygon, useMap } from "react-leaflet";
import type { FieldPolygon } from "../algorithm/types";
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet";

interface FieldDisplayProps {
  polygon: FieldPolygon | null;
  /** Whether this polygon was imported (vs drawn with Geoman) */
  isImported: boolean;
}

export function FieldDisplay({ polygon, isImported }: FieldDisplayProps) {
  const map = useMap();

  // Fit map bounds to polygon when imported
  useEffect(() => {
    if (!polygon || !isImported) return;
    const latlngs: [number, number][] = polygon.coordinates.map((c) => [
      c[1],
      c[0],
    ]);
    if (latlngs.length > 2) {
      const bounds = latlngs as LatLngBoundsExpression;
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [polygon, isImported, map]);

  // Only render the polygon overlay for imported polygons
  // Geoman-drawn polygons are rendered by Geoman itself
  if (!polygon || !isImported) return null;

  const positions: LatLngExpression[] = polygon.coordinates.map((c) => [
    c[1],
    c[0],
  ]);

  return (
    <LeafletPolygon
      positions={positions}
      pathOptions={{
        color: "#008000",
        fillColor: "#008000",
        fillOpacity: 0.15,
        weight: 2,
      }}
    />
  );
}
