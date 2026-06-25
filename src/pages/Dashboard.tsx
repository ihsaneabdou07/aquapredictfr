import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import { NetworkMap } from "@/components/NetworkMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

interface SensorData {
  id: string;
  created_at: string;
  flow_rate: number;
  pressure: number;
  temperature: number;
  is_leak_alert: boolean;
  leak_probability?: number; // Nouveau champ pour le SVM
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export default function Dashboard() {
  const [data, setData] = useState<SensorData[]>([]);
  const [lastPrediction, setLastPrediction] = useState<number>(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: initialData } = await supabase
        .from('sensor_readings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (initialData) setData(initialData.reverse());
    };

    fetchInitialData();

    const subscription = supabase
      .channel('public:sensor_readings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, 
        async (payload) => {
          const newData = payload.new as SensorData;

          // APPEL AU MODÈLE SVM (API FastAPI)
          try {
            const response = await fetch('http://localhost:8000/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                pressure: newData.pressure, 
                flow: newData.flow_rate, 
                temp: newData.temperature 
              })
            });
            const result = await response.json();
            const prob = result.leak_probability;
            
            setLastPrediction(prob);
            setData((current) => [...current.slice(-29), { ...newData, leak_probability: prob }]);
          } catch (err) {
            console.error("Erreur SVM:", err);
            setData((current) => [...current.slice(-29), newData]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* EN-TÊTE AVEC SOLUTION SVM */}
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

        {/* GRAPHIQUE AVEC COURBE SVM */}
        <div className="h-64 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="created_at" tickFormatter={formatTime} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="flow_rate" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} name="Débit" />
              {/* Courbe de probabilité SVM */}
              <Area type="step" dataKey="leak_probability" stroke="#ef4444" fill="transparent" name="Probabilité Fuite" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <NetworkMap />
      </div>
    </div>
  );
}