import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
// L'import du CSS est obligatoire pour que la carte ne soit pas transparente
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction indispensable pour afficher les icônes de marqueurs sur React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Sensor {
  id: string;
  name: string;
  coordinates: [number, number];
  type: string;
  flowRate?: number;
  status: 'Normal' | 'Alerte Fuite' | 'Hors ligne';
}

interface Pipe {
  id: string;
  path: [number, number][];
  diameter: number;
}

export function NetworkMap() {
  // Coordonnées centrées sur la région de Casablanca/Bouskoura
  const center: [number, number] = [33.45, -7.62];

  const sensors: Sensor[] = [
    { id: 'S1', name: 'ESP32 - Noeud Principal', coordinates: [33.45, -7.62], type: 'Débitmètre FS300A', flowRate: 45.2, status: 'Normal' },
    { id: 'S2', name: 'ESP32 - Secteur B', coordinates: [33.455, -7.615], type: 'Débitmètre FS300A', flowRate: 38.1, status: 'Alerte Fuite' },
    { id: 'S3', name: 'Vanne de contrôle', coordinates: [33.448, -7.61], type: 'Pression', status: 'Normal' },
  ];

  const pipes: Pipe[] = [
    { id: 'P1', path: [[33.45, -7.62], [33.455, -7.615]], diameter: 100 },
    { id: 'P2', path: [[33.45, -7.62], [33.448, -7.61]], diameter: 75 },
  ];

  return (
    // Le style en ligne est CRUCIAL ici
    <div style={{ height: '500px', width: '100%' }} className="relative z-0 rounded-xl overflow-hidden border border-slate-700">
      <MapContainer 
        center={center} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pipes.map((pipe) => (
          <Polyline 
            key={pipe.id} 
            positions={pipe.path} 
            color="#22d3ee" // Cyan pour bien ressortir sur le thème sombre
            weight={pipe.diameter > 80 ? 6 : 4} 
            opacity={0.8}
          >
            <Popup>Tuyau {pipe.id} (Diamètre: {pipe.diameter}mm)</Popup>
          </Polyline>
        ))}

        {sensors.map((sensor) => (
          <Marker key={sensor.id} position={sensor.coordinates}>
            <Popup>
              <div className="p-1 font-sans text-slate-900">
                <h3 className="font-bold text-sm mb-1">{sensor.name}</h3>
                <p className="text-xs text-slate-600">Type: {sensor.type}</p>
                {sensor.flowRate && (
                  <p className="text-xs mt-1">Débit: <span className="font-semibold">{sensor.flowRate} L/min</span></p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${sensor.status === 'Alerte Fuite' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                  <span className={`text-xs font-semibold ${sensor.status === 'Alerte Fuite' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {sensor.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}