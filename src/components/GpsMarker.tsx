import { CircleMarker, Circle, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import type { Position } from "../algorithm/types";
import type { LatLngExpression } from "leaflet";

interface GpsMarkerProps {
  position: Position;
  accuracy: number | null;
  /** If true, map will pan to follow the GPS position */
  followMode: boolean;
}

function toLatLng(pos: Position): LatLngExpression {
  return [pos[1], pos[0]];
}

function MapFollower({
  position,
  followMode,
}: {
  position: Position;
  followMode: boolean;
}) {
  const map = useMap();
  const isFirst = useRef(true);

  useEffect(() => {
    if (!followMode) {
      isFirst.current = true;
      return;
    }
    const ll = toLatLng(position);
    if (isFirst.current) {
      map.setView(ll, Math.max(map.getZoom(), 17));
      isFirst.current = false;
    } else {
      map.panTo(ll);
    }
  }, [position, followMode, map]);

  return null;
}

export function GpsMarker({ position, accuracy, followMode }: GpsMarkerProps) {
  const center = toLatLng(position);

  return (
    <>
      {/* Accuracy circle */}
      {accuracy != null && accuracy > 0 && (
        <Circle
          center={center}
          radius={accuracy}
          color="#3b82f6"
          fillColor="#3b82f6"
          fillOpacity={0.1}
          weight={1}
        />
      )}
      {/* Position dot */}
      <CircleMarker
        center={center}
        radius={8}
        color="#fff"
        fillColor="#3b82f6"
        fillOpacity={1}
        weight={3}
      />
      <MapFollower position={position} followMode={followMode} />
    </>
  );
}
