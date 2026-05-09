import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import type { FieldPolygon, Position } from "../algorithm/types";

interface PolygonDrawerProps {
  onPolygonCreated: (polygon: FieldPolygon) => void;
  onPolygonCleared: () => void;
}

export function PolygonDrawer({
  onPolygonCreated,
  onPolygonCleared,
}: PolygonDrawerProps) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    map.pm.addControls({
      position: "topleft",
      drawPolygon: true,
      drawMarker: false,
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
    });

    const handleCreate = (e: { layer: L.Layer }) => {
      // Remove previous polygon if exists
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
      layerRef.current = e.layer;

      const layer = e.layer as L.Polygon;
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      const coordinates: Position[] = latlngs.map((ll) => [ll.lng, ll.lat]);
      coordinates.push(coordinates[0]); // close the ring
      onPolygonCreated({ coordinates });
    };

    const handleEdit = () => {
      if (!layerRef.current) return;
      const layer = layerRef.current as L.Polygon;
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      const coordinates: Position[] = latlngs.map((ll) => [ll.lng, ll.lat]);
      coordinates.push(coordinates[0]);
      onPolygonCreated({ coordinates });
    };

    const handleRemove = () => {
      layerRef.current = null;
      onPolygonCleared();
    };

    map.on("pm:create", handleCreate);
    map.on("pm:edit", handleEdit);
    map.on("pm:remove", handleRemove);

    return () => {
      map.pm.removeControls();
      map.off("pm:create", handleCreate);
      map.off("pm:edit", handleEdit);
      map.off("pm:remove", handleRemove);
    };
  }, [map, onPolygonCreated, onPolygonCleared]);

  return null;
}
