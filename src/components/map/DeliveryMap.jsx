// src/components/map/DeliveryMap.jsx
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon paths broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(emoji, color = '#1D9E75') {
  return L.divIcon({
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25)"><span style="transform:rotate(45deg);font-size:18px">${emoji}</span></div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

function PickupIcon()  { return makeIcon('📦', '#1D9E75'); }
function DropoffIcon() { return makeIcon('🏁', '#E24B4A'); }
function TruckIcon()   {
  return L.divIcon({
    html: `<div style="background:#185FA5;width:38px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.2)">🚛</div>`,
    className: '',
    iconSize: [38, 26],
    iconAnchor: [19, 13],
  });
}

// Auto-pan when driver position changes
function MoveTruck({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.panTo(position, { animate: true, duration: 1 });
  }, [position, map]);
  return null;
}

export default function DeliveryMap({
  pickup,        // { lat, lng, label }
  dropoff,       // { lat, lng, label }
  driverPos,     // { lat, lng }
  route,         // [[lat,lng], ...] polyline
  height = 220,
  followDriver = false,
}) {
  const center = pickup
    ? [pickup.lat, pickup.lng]
    : [47.9184, 106.9177]; // Ulaanbaatar default

  return (
    <div style={{ height, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', marginBottom: 12 }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={makeIcon('📦', '#1D9E75')}>
            <Popup>{pickup.label || 'Авах байршил'}</Popup>
          </Marker>
        )}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={makeIcon('🏁', '#E24B4A')}>
            <Popup>{dropoff.label || 'Хүргэх байршил'}</Popup>
          </Marker>
        )}
        {driverPos && (
          <Marker position={[driverPos.lat, driverPos.lng]} icon={TruckIcon()}>
            <Popup>Жолоочийн байршил</Popup>
          </Marker>
        )}
        {route && route.length > 1 && (
          <Polyline positions={route} pathOptions={{ color: '#1D9E75', weight: 4, dashArray: '8 6' }} />
        )}
        {followDriver && driverPos && <MoveTruck position={[driverPos.lat, driverPos.lng]} />}
      </MapContainer>
    </div>
  );
}
