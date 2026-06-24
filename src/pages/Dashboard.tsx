import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Imports de tes composants d'interface
import { NetworkMap } from "@/components/NetworkMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Initialisation du client Supabase
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
}

// Fonction utilitaire pour formater l'horodatage
const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Info-bulle (Tooltip) personnalisée
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
  const [alertActive, setAlertActive] = useState<boolean>(false);

  useEffect(() => {
    // 1. Charger l'historique initial
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

    // 2. Écouter la table en temps réel
    const subscription = supabase
      .channel('public:sensor_readings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          const newData = payload.new as SensorData;
          setData((currentData) => {
            const updatedData = [...currentData, newData];
            return updatedData.length > 30 ? updatedData.slice(1) : updatedData;
          });
          setAlertActive(newData.is_leak_alert);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-white tracking-wide">
            MONITORING ET FLUX EN TEMPS RÉEL
          </h1>
          
          {/* Indice d'alerte pour détection de pertes d'eau */}
          {alertActive ? (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-5 py-2 rounded-full font-bold animate-pulse flex items-center gap-2 shadow-lg shadow-red-500/10">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              ⚠️ ANOMALIE : Chute de pression / Fuite suspectée !
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-2 rounded-full font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Réseau stable
            </div>
          )}
        </header>

        {/* SECTION CARTOGRAPHIE */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Cartographie du Réseau</CardTitle>
          </CardHeader>
          <CardContent>
            <NetworkMap />
          </CardContent>
        </Card>

        {/* SECTION GRAPHIQUES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* GRAPH_1 : DÉBIT */}
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
            <h3 className="text-cyan-400 font-semibold mb-4 flex items-center gap-2 text-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"></span> 
              Débit du réseau (L/min)
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#475569" fontSize={11} tickMargin={10} />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="flow_rate" name="Débit" unit="L/min" stroke="#22d3ee" strokeWidth={2.5} fill="url(#colorFlow)" dot={{ r: 2, fill: '#22d3ee', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRAPH_2 : PRESSION (Fermeture des balises corrigée) */}
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
            <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2 text-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"></span> 
              Pression hydraulique (bar)
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#facc15" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#475569" fontSize={11} tickMargin={10} />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="pressure" name="Pression" unit="bar" stroke="#facc15" strokeWidth={2.5} fill="url(#colorPressure)" dot={{ r: 2, fill: '#facc15', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}