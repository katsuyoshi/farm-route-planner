import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { ReactNode } from "react";

interface MapViewProps {
  children?: ReactNode;
}

export function MapView({ children }: MapViewProps) {
  return (
    <MapContainer
      center={[39.45, 140.48]}
      zoom={16}
      maxZoom={22}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxNativeZoom={19}
        maxZoom={22}
      />
      {children}
    </MapContainer>
  );
}
