import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-polylinedecorator";
import type { Position } from "../algorithm/types";
import type { LatLngExpression } from "leaflet";

interface ArrowOverlayProps {
  /** Full route path in GeoJSON [lng, lat] */
  path: Position[];
  /** Headland path in GeoJSON [lng, lat] */
  headlandPath: Position[];
}

function toLatLng(pos: Position): LatLngExpression {
  return [pos[1], pos[0]];
}

export function ArrowOverlay({ path, headlandPath }: ArrowOverlayProps) {
  const map = useMap();

  useEffect(() => {
    const layers: L.Layer[] = [];

    // Interior path (full path minus headland)
    const interiorLen = path.length - headlandPath.length;
    if (interiorLen >= 2) {
      const interiorCoords = path.slice(0, interiorLen).map(toLatLng);
      const interiorDeco = (L as any).polylineDecorator(interiorCoords, {
        patterns: [
          {
            offset: "30px",
            repeat: "80px",
            symbol: (L as any).Symbol.arrowHead({
              pixelSize: 10,
              polygon: false,
              pathOptions: { color: "#2563eb", weight: 2, opacity: 0.9 },
            }),
          },
        ],
      });
      interiorDeco.addTo(map);
      layers.push(interiorDeco);
    }

    // Headland path
    if (headlandPath.length >= 2) {
      const headlandCoords = headlandPath.map(toLatLng);
      const headlandDeco = (L as any).polylineDecorator(headlandCoords, {
        patterns: [
          {
            offset: "30px",
            repeat: "80px",
            symbol: (L as any).Symbol.arrowHead({
              pixelSize: 10,
              polygon: false,
              pathOptions: { color: "#059669", weight: 2, opacity: 0.9 },
            }),
          },
        ],
      });
      headlandDeco.addTo(map);
      layers.push(headlandDeco);
    }

    return () => {
      for (const layer of layers) {
        map.removeLayer(layer);
      }
    };
  }, [map, path, headlandPath]);

  return null;
}
