import React from 'react';
import networkImage from '../../image.png';

interface Sensor {
  id: string;
  name: string;
  position: { top: string; left: string };
  type: string;
  status: 'Normal' | 'Alerte Fuite' | 'Hors ligne';
}

// Props pour rendre la carte réactive
interface NetworkMapProps {
  leakDetected?: boolean;
}

export function NetworkMap({ leakDetected = false }: NetworkMapProps) {
  const sensors: Sensor[] = [
    { id: 'G1', name: 'Capteur G', position: { top: '28%', left: '35%' }, type: 'Débit / pompe', status: 'Normal' },
    { id: 'P1', name: 'Capteur P', position: { top: '20%', left: '52%' }, type: 'Pression', status: leakDetected ? 'Alerte Fuite' : 'Normal' },
    { id: 'T1', name: 'Capteur T', position: { top: '62%', left: '65%' }, type: 'Température', status: 'Normal' },
  ];

  return (
    <div className="relative h-[500px] w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
      <img
        src={networkImage}
        alt="Réseau hydraulique"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-80 filter brightness-90"
      />
      <div className="absolute inset-0 bg-slate-950/60" />

      <div className="absolute inset-0">
        {sensors.map((sensor) => (
          <div
            key={sensor.id}
            className={`absolute h-3 w-3 rounded-full border-2 ${sensor.status === 'Alerte Fuite' ? 'border-rose-400 bg-rose-500/80' : 'border-emerald-400 bg-emerald-500/80'}`}
            style={{ top: sensor.position.top, left: sensor.position.left, transform: 'translate(-50%, -50%)' }}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="absolute bottom-4 right-4 rounded-3xl border border-slate-700 bg-slate-950/90 p-4 text-sm text-slate-100 backdrop-blur-xl shadow-lg">
        <div className="font-semibold mb-2">Statut réseau</div>
        <div className={leakDetected ? 'text-rose-400' : 'text-emerald-400'}>
          {leakDetected ? 'Fuite détectée' : 'Réseau stable'}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 rounded-3xl border border-slate-700 bg-slate-950/90 p-4 text-xs text-slate-100 backdrop-blur-xl shadow-lg max-w-xs">
        <div className="font-semibold mb-2">Capteurs</div>
        <div className="space-y-1">
          <div><span className="font-semibold text-emerald-300">G1</span> : capteur de débit / pompe, haut gauche</div>
          <div><span className="font-semibold text-emerald-300">P1</span> : capteur de pression, haut centre</div>
          <div><span className="font-semibold text-emerald-300">T1</span> : capteur de température, bas droite</div>
        </div>
      </div>
    </div>
  );
}