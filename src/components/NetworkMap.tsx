import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction du bug d'affichage des icônes par défaut de Leaflet dans React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Types pour tes données géospatiales
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
  // Coordonnées de test (ex: positionnées vers Bouskoura/Casablanca)
  const center: [number, number] = [33.45, -7.62];

  // Données fictives des capteurs (ESP32 + FS300A, etc.)
  const sensors: Sensor[] = [
    { id: 'S1', name: 'ESP32 - Noeud Principal', coordinates: [33.45, -7.62], type: 'Débitmètre FS300A', flowRate: 45.2, status: 'Normal' },
    { id: 'S2', name: 'ESP32 - Secteur B', coordinates: [33.455, -7.615], type: 'Débitmètre FS300A', flowRate: 38.1, status: 'Alerte Fuite' },
    { id: 'S3', name: 'Vanne de contrôle', coordinates: [33.448, -7.61], type: 'Pression', status: 'Normal' },
  ];

  // Données fictives du réseau de tuyauterie
  const pipes: Pipe[] = [
    { id: 'P1', path: [[33.45, -7.62], [33.455, -7.615]], diameter: 100 },
    { id: 'P2', path: [[33.45, -7.62], [33.448, -7.61]], diameter: 75 },
  ];

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border border-border shadow-sm">
      <MapContainer center={center} zoom={15} className="w-full h-full">
        {/* Fond de carte OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Tracé des tuyaux */}
        {pipes.map((pipe) => (
          <Polyline 
            key={pipe.id} 
            positions={pipe.path} 
            color="#3b82f6" // Bleu tailwind pour l'eau
            weight={pipe.diameter > 80 ? 6 : 4} 
            opacity={0.7}
          >
            <Popup>Tuyau {pipe.id} (Diamètre: {pipe.diameter}mm)</Popup>
          </Polyline>
        ))}

        {/* Placement des capteurs */}
        {sensors.map((sensor) => (
          <Marker key={sensor.id} position={sensor.coordinates}>
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-sm mb-1">{sensor.name}</h3>
                <p className="text-xs text-muted-foreground">Type: {sensor.type}</p>
                {sensor.flowRate && (
                  <p className="text-xs mt-1">Débit actuel: <span className="font-semibold">{sensor.flowRate} L/min</span></p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${sensor.status === 'Alerte Fuite' ? 'bg-destructive' : 'bg-green-500'}`}></span>
                  <span className={`text-xs font-semibold ${sensor.status === 'Alerte Fuite' ? 'text-destructive' : 'text-green-600'}`}>
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