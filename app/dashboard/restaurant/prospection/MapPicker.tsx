'use client';

import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correctif connu : les bundlers (Webpack/Turbopack) cassent les chemins
// par défaut des icônes Leaflet. On pointe explicitement vers le CDN.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Centre par défaut : Tunis, Tunisie
const DEFAULT_CENTER: [number, number] = [36.8065, 10.1815];
const DEFAULT_ZOOM = 7;

interface MapPickerProps {
  radiusKm: number;
  onSelect: (lat: number, lng: number) => void;
  selected: { lat: number; lng: number } | null;
}

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ radiusKm, onSelect, selected }: MapPickerProps) {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <MapContainer
        center={selected ? [selected.lat, selected.lng] : DEFAULT_CENTER}
        zoom={selected ? 12 : DEFAULT_ZOOM}
        style={{ height: 320, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={onSelect} />
        {selected && (
          <>
            <Marker position={[selected.lat, selected.lng]} />
            <Circle
              center={[selected.lat, selected.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: '#00C48C', fillColor: '#00C48C', fillOpacity: 0.15 }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
