import React, { useRef, useEffect } from "react";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { MapCoordinate, MapResponse } from "../types";

interface RouteMapProps {
  mData: MapResponse | null;
  loading: boolean;
}

// Componente helper para ajustar o bounds
const FitBounds: React.FC<{ coordinates: MapCoordinate[] }> = ({ coordinates }) => {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(
        coordinates.map(c => [c.lat, c.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);

  return null;
};

const RouteMap: React.FC<RouteMapProps> = ({ mData, loading }) => {
  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-slate-100 rounded-xl">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!mData || !mData.coordinates || mData.coordinates.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 bg-slate-100 rounded-xl">
        <span>Nenhuma coordenada disponível</span>
      </div>
    );
  }

  const start = mData.coordinates[0];
  const end = mData.coordinates[mData.coordinates.length - 1];

  const markerIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden shadow-md">
      <MapContainer
        center={[start.lat, start.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds coordinates={mData.coordinates} />

        <Polyline
          positions={mData.coordinates.map((c) => [c.lat, c.lng])}
          pathOptions={{ color: "#8b5cf6", weight: 4, opacity: 0.8 }}
        />

        <Marker position={[start.lat, start.lng]} icon={markerIcon} />
        <Marker position={[end.lat, end.lng]} icon={markerIcon} />
      </MapContainer>
    </div>
  );
};

export default RouteMap;