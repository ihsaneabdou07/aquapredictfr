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
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-white">
        <p className="text-xs text-slate-400 mb-2">Relevé à {formatTime(label)}</p>
        <p className="font-bold text-lg flex items-center gap-2" style={{ color: data.stroke }}>
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.stroke }}></span>
          {data.value.toFixed(2)} {data.unit}
        </p>
      </div>
    );
  }
  return null;
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

  // Gestion de l'upload d'image
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
    const fetchInitialData = async () => {
      const { data: initialData } = await supabase
        .from('sensor_readings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (initialData && initialData.length > 0) {
        setData(initialData.reverse());
        setAlertActive(initialData[initialData.length - 1]?.is_leak_alert || false);
      }
    };

    fetchInitialData();

    const subscription = supabase
      .channel('public:sensor_readings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, 
        (payload) => {
          const newData = payload.new as SensorData;
          setData((currentData) => [...currentData.slice(-29), newData]);
          setAlertActive(newData.is_leak_alert);
        }

    return () => { supabase.removeChannel(subscription); };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-white tracking-wide">MONITORING RÉSEAU</h1>
          {alertActive ? (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-5 py-2 rounded-full font-bold animate-pulse">⚠️ ALERTE : FUITE DÉTECTÉE</div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-2 rounded-full">Réseau stable</div>
          )}
        </header>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Cartographie et Analyse IA</CardTitle>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Upload size={18} />
                <span>Analyser Plan Réseau</span>
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>
            </div>
          </CardHeader>
          <CardContent>
            <NetworkMap leakDetected={lastPrediction > 0.5} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
            <h3 className="text-cyan-400 font-semibold mb-4">Débit (L/min)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#475569" fontSize={11} />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="flow_rate" stroke="#22d3ee" fill="url(#colorFlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
            <h3 className="text-yellow-400 font-semibold mb-4">Pression (bar)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#475569" fontSize={11} />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="pressure" stroke="#facc15" fill="url(#colorPressure)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// Dans Dashboard.tsx
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files || e.target.files.length === 0) return;
  const file = e.target.files[0];
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Envoi vers votre API Python locale
    const response = await fetch('http://localhost:8000/analyze-network', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    console.log("Composants détectés:", result);
  } catch (error) {
    console.error("Erreur d'analyse:", error);
  }
};