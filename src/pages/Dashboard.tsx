import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Upload } from "lucide-react";

import { NetworkMap } from "@/components/NetworkMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SensorData {
  id: string;
  created_at: string;
  flow_rate: number;
  pressure: number;
  temperature: number;
  is_leak_alert: boolean;
  leak_probability?: number;
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export default function Dashboard() {
  const [data, setData] = useState<SensorData[]>([]);
  const [lastPrediction, setLastPrediction] = useState<number>(0);

  // Fonction pour gérer l'upload d'image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/analyze-network', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      console.log("Composants détectés par IA:", result);
      alert("Analyse terminée ! Vérifie la console pour les coordonnées.");
    } catch (error) {
      console.error("Erreur lors de l'analyse:", error);
    }
  };

  useEffect(() => {
    const socket = new WebSocket("ws://10.100.10.30:3001");

    socket.onopen = () => {
      console.log("✅ Connected WebSocket");
    };

    socket.onmessage = async (event) => {
      try {
        const json = JSON.parse(event.data);

        const flow = json?.data?.flow_rate ?? json.flow_rate ?? json.flow ?? 0;
        const pressure = json?.data?.pressure ?? json.pressure ?? 0;
        const temperature = json?.data?.temperature ?? json.temperature ?? json.temp ?? 18.5;

        let leak_probability: number | undefined;
        try {
          const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pressure, flow, temp: temperature }),
          });

          if (response.ok) {
            const result = await response.json();
            leak_probability = typeof result.leak_probability === 'number' ? result.leak_probability : undefined;
          } else {
            console.error('Erreur SVM API', response.status);
          }
        } catch (err) {
          console.error('Erreur appel SVM:', err);
        }

        const newData: SensorData = {
          id: Math.random().toString(36).slice(2),
          created_at: new Date().toISOString(),
          flow_rate: flow,
          pressure,
          temperature,
          is_leak_alert: leak_probability !== undefined && leak_probability >= 0.5,
          ...(leak_probability !== undefined ? { leak_probability } : {}),
        };

        setData((current) => [...current.slice(-29), newData]);
        setLastPrediction((current) => leak_probability ?? current);
      } catch (err) {
        console.error('❌ JSON error', err);
      }
    };

    socket.onerror = (err) => {
      console.error('❌ WS ERROR:', err);
    };

    socket.onclose = () => {
      console.log('❌ WS closed');
    };

    return () => socket.close();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* EN-TÊTE AVEC DIAGNOSTIC SVM */}
        <header className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b border-slate-800 pb-6">
          <h1 className="text-2xl font-bold text-white col-span-2">ANALYSE HYDRAULIQUE SVM</h1>
          
          <div className={`p-4 rounded-xl border ${lastPrediction > 0.5 ? 'bg-red-900/30 border-red-500' : 'bg-emerald-900/30 border-emerald-500'}`}>
            <p className="text-xs uppercase text-slate-400">Diagnostic IA :</p>
            <p className="font-bold text-lg">
              {lastPrediction > 0.5 ? "⚠️ Fuite détectée" : "✅ Réseau stable"}
            </p>
            <p className="text-xs opacity-75">
              {lastPrediction > 0.5 ? "Solution : Vérifier raccordement zone 01" : "Fonctionnement optimal"}
            </p>
          </div>
        </header>

        {/* SECTION CARTOGRAPHIE AVEC UPLOAD */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Cartographie du Réseau</CardTitle>
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
              <Upload size={18} />
              <span>Analyser Plan Réseau</span>
              <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
            </label>
          </CardHeader>
          <CardContent>
            <NetworkMap leakDetected={lastPrediction > 0.5} />
          </CardContent>
        </Card>

        {/* GRAPHIQUE */}
        <div className="h-64 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="created_at" tickFormatter={formatTime} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="flow_rate" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} name="Débit" />
              <Area type="step" dataKey="leak_probability" stroke="#ef4444" fill="transparent" name="Probabilité Fuite" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}