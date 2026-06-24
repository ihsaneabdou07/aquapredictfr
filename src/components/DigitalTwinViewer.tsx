import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Cylinder, Box, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface DigitalTwinProps {
  dn: number; // Diamètre nominal (mm)
  length: number; // Longueur (m)
  sensorType: string;
  sensorName: string;
}

const PipeModel = ({ dn, length, sensorType, sensorName }: DigitalTwinProps) => {
  // Conversion des dimensions pour un affichage 3D proportionné
  const radius = (dn / 1000) * 2; // Ajustement d'échelle visuelle
  const visualLength = Math.min(length / 10, 15); // On limite la longueur visuelle max

  return (
    <group>
      {/* 1. Le Tuyau Principal */}
      <Cylinder 
        args={[radius, radius, visualLength, 32]} 
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial 
          color="#3b82f6" 
          transparent 
          opacity={0.8} 
          metalness={0.5} 
          roughness={0.2}
        />
      </Cylinder>

      {/* 2. Le Capteur (Placé au centre du tuyau) */}
      {sensorType !== 'non' && (
        <group position={[0, radius + 0.3, 0]}>
          {/* Boîtier du capteur (représente l'ESP32 / Débitmètre) */}
          <Box args={[0.6, 0.6, 0.6]}>
            <meshStandardMaterial color="#ef4444" metalness={0.8} />
          </Box>
          
          {/* Étiquette flottante HTML au-dessus du capteur */}
          <Html position={[0, 0.8, 0]} center distanceFactor={10}>
            <div className="bg-slate-900/90 text-white px-3 py-1.5 rounded-lg border border-slate-700 shadow-xl whitespace-nowrap pointer-events-none">
              <p className="font-bold text-sm text-cyan-400">{sensorName}</p>
              <p className="text-xs text-slate-300">Type: {sensorType}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] uppercase tracking-wider">Actif</span>
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};

export default function DigitalTwinViewer({ data }: { data: any }) {
  return (
    <div className="w-full h-[400px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative shadow-inner">
      <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        Jumeau Numérique 3D Généré
      </div>
      
      <Canvas camera={{ position: [0, 3, 8], fov: 45 }}>
        {/* Éclairage réaliste */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
        <Environment preset="city" />
        
        {/* Le modèle généré */}
        <PipeModel 
          dn={Number(data.dn) || 100} 
          length={Number(data.length) || 100} 
          sensorType={data.hasSensor || 'debitmetre'}
          sensorName={data.lineId || "Nœud Principal"}
        />
        
        {/* Contrôles pour tourner autour du modèle avec la souris */}
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      
      <div className="absolute bottom-4 right-4 z-10 text-xs text-slate-400 bg-black/40 px-2 py-1 rounded">
        Faites glisser pour pivoter • Scrollez pour zoomer
      </div>
    </div>
  );
}