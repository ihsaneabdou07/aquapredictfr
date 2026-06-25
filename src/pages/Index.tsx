import { useEffect, useState } from 'react';
// import { createClient } from '@supabase/supabase-js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Activity, Droplets, Gauge, Thermometer, AlertTriangle, CheckCircle, 
  Settings, Search, MapPin, User, Hash, HardDrive, ShieldCheck, Download, Zap, Database
} from 'lucide-react';

import LossSearchPlan from "../components/LossSearchPlan";

// const supabase = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
// );

interface SensorData {
  id: string;
  created_at: number;
  flow_rate: number;
  pressure: number;
  temperature: number;
  is_leak_alert: boolean;
  leak_probability?: number;
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ stroke: string; name: string; value: number; unit: string }>; label?: string | number }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B1121]/90 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl shadow-2xl z-50">
        <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">Relevé : {label !== undefined ? formatTime(String(label)) : ''}</p>
        {payload.map((entry: { stroke: string; name: string; value: number; unit: string }, index: number) => (
          <p key={index} className="font-bold text-sm flex items-center gap-3 mb-1" style={{ color: entry.stroke }} aria-label={`${entry.name}: ${entry.value.toFixed(2)} ${entry.unit}`}>
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.stroke, boxShadow: `0 0 8px ${entry.stroke}` }} aria-hidden="true"></span>
            {entry.name} : <span className="text-white ml-auto pl-4">{entry.value.toFixed(2)} {entry.unit}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Index() {
  const [activeTab, setActiveTab] = useState<'config' | 'analytics'>('analytics');
  const [inputMode, setInputMode] = useState<'manuel' | 'intelligent'>('manuel');
  const [isScanning, setIsScanning] = useState(false);
  const [data, setData] = useState<SensorData[]>([]);
  const [leakProbability, setLeakProbability] = useState<number | null>(null);
  const [alertActive, setAlertActive] = useState<boolean>(false);

  const [clientConfig, setClientConfig] = useState({ nomClient: '', responsable: '', localisation: '', referenceProjet: '' });
  const [pipeConfig, setPipeConfig] = useState({
    idTroncon: 'TR-Z1-042', zoneAEP: 'Secteur Centre-Ville', materiau: 'FONTE', diametreNominal: '150',
    longueur: '1200', rugosite: '0.1', pressionPN: '16', debitConsigne: '40', altitudeAmont: '', altitudeAval: ''
  });

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => setClientConfig({ ...clientConfig, [e.target.name]: e.target.value });
  const handlePipeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPipeConfig(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'materiau') {
        updated.rugosite = value === 'PEHD' ? '0.007' : value === 'PVC' ? '0.01' : value === 'FONTE' ? '0.1' : '0.05';
      }
      return updated;
    });
  };

  const handleSmartScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setClientConfig({ nomClient: 'ONEE - Branche Eau', responsable: 'Équipe Maintenance', localisation: 'Station Sud', referenceProjet: 'AQUA-IOT-01' });
      setPipeConfig({ idTroncon: 'TR-ESP32-NODE-1', zoneAEP: 'Zone Test', materiau: 'PEHD', diametreNominal: '100', longueur: '850', rugosite: '0.007', pressionPN: '16', debitConsigne: '45', altitudeAmont: '120.5', altitudeAval: '115.0' });
      setIsScanning(false);
      setInputMode('manuel');
    }, 1500);
  };

  const currentFlow = data[data.length - 1]?.flow_rate || 0;
  const currentPressure = data[data.length - 1]?.pressure || 0;
  const currentTemperature = data[data.length - 1]?.temperature || 0;
  const targetFlow = Number(pipeConfig.debitConsigne);
  const flowDeviation = Math.max(0, currentFlow - targetFlow);
  const estimatedLossVolume = flowDeviation > 0 ? (flowDeviation * 1440) / 1000 : 0;
  const leakProbabilityPercent = leakProbability !== null ? Math.round(leakProbability * 100) : null;

useEffect(() => {
  const socket = new WebSocket("ws://10.100.10.30:3001");

  socket.onopen = () => {
    console.log("✅ Connected WebSocket");
  };

  socket.onmessage = async (event) => {
    console.log("📡 RAW:", event.data);

    try {
      const json = JSON.parse(event.data);

      const flow =
        json?.data?.flow_rate ??
        json.flow_rate ??
        json.flow ??
        0;
      const pressure =
        json?.data?.pressure ??
        json.pressure ??
        0;
      const temperature =
        json?.data?.temperature ??
        json.temperature ??
        json.temp ??
        18.5;

      const now = new Date().getTime();

      let leak_probability: number | undefined;
      try {
        const response = await fetch(import.meta.env.VITE_SVM_API_URL ?? "http://127.0.0.1:8000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pressure, flow, temp: temperature }),
        });

        if (response.ok) {
          const result = await response.json();
          leak_probability = typeof result.leak_probability === 'number' ? result.leak_probability : undefined;
        } else {
          console.error("Erreur SVM API", response.status);
        }
      } catch (err) {
        console.error("Erreur appel SVM:", err);
      }

      const newPoint: SensorData = {
        id: Math.random().toString(),
        created_at: now,
        flow_rate: flow,
        pressure,
        temperature,
        is_leak_alert: leak_probability !== undefined && leak_probability >= 0.5,
        ...(leak_probability !== undefined ? { leak_probability } : {}),
      };

      setData((prev) => [...prev, newPoint].slice(-30));
      setLeakProbability(leak_probability ?? null);
      setAlertActive(leak_probability !== undefined && leak_probability >= 0.5);

    } catch (e) {
      console.log("❌ JSON error", e);
    }
  };

  socket.onerror = (err) => {
    console.log("❌ WS ERROR:", err);
  };

  socket.onclose = () => {
    console.log("❌ WS closed");
  };

  return () => socket.close();
}, []);

  return (
    <div className="min-h-screen bg-[#060B14] p-4 md:p-8 font-sans text-slate-200 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#060B14] to-[#060B14]">
      <div className="max-w-[1400px] mx-auto">
        
        {/* --- HEADER GLOBAL --- */}
        <header className="mb-10 flex flex-col xl:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Droplets className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                AQUAPREDICT <span className="text-indigo-400 font-light">ANALYTICS</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-medium tracking-wide">Mitigation des pertes physiques & Efficacité réseau</p>
            </div>
          </div>

          <div className="flex bg-[#0F172A]/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 shadow-inner">
            <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'analytics' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              <Search className="w-4 h-4" /> Diagnostic Prédictif
            </button>
            <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'config' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              <Settings className="w-4 h-4" /> Saisie & Config
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {alertActive ? (
              <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 px-5 py-2.5 rounded-xl font-bold animate-pulse flex flex-col gap-2">
                <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5" /> FUITE SUSPECTÉE</div>
                <div className="text-sm text-slate-200">Probabilité : {leakProbability !== null ? `${(leakProbability*100).toFixed(1)}%` : 'En attente'}</div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-2.5 rounded-xl font-medium flex flex-col gap-2">
                <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> Réseau Nominal</div>
                <div className="text-sm text-slate-200">Probabilité : {leakProbability !== null ? `${(leakProbability*100).toFixed(1)}%` : 'En attente'}</div>
              </div>
            )}
          </div>
        </header>

        {/* ========================================= */}
        {/* VUE 1 : CONFIGURATION                     */}
        {/* ========================================= */}
        {activeTab === 'config' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            
            <div className="flex justify-center mb-4">
              <div className="bg-[#0F172A] p-1.5 rounded-2xl border border-slate-800 inline-flex shadow-2xl">
                <button onClick={() => setInputMode('manuel')} className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${inputMode === 'manuel' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
                  Saisie Manuelle
                </button>
                <button onClick={() => setInputMode('intelligent')} className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${inputMode === 'intelligent' ? 'bg-indigo-500/20 text-indigo-300 shadow-md border border-indigo-500/30' : 'text-slate-500 hover:text-indigo-400/70'}`}>
                  <Zap className="w-4 h-4" /> Saisie Intelligente
                </button>
              </div>
            </div>

            {inputMode === 'intelligent' && (
              <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-indigo-500/30 p-10 rounded-3xl shadow-2xl text-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                  <HardDrive className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Importation Automatique IoT</h2>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">Connectez-vous à l'instrumentation Edge (ESP32) ou importez les métadonnées de votre jumeau numérique (EPANET) pour pré-remplir les données.</p>
                <button onClick={handleSmartScan} disabled={isScanning} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-4 px-10 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 flex items-center justify-center mx-auto gap-3">
                  {isScanning ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Synchronisation...</> : <><Search className="w-5 h-5"/> Lancer le Scan Local</>}
                </button>
              </div>
            )}

            {inputMode === 'manuel' && (
              <div className="space-y-6">
                <div className="bg-[#0F172A]/60 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl shadow-xl">
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3 border-b border-slate-800/80 pb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg"><User className="w-5 h-5 text-indigo-400" /></div> Client & Régie
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div><label htmlFor="nomClient" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Nom du Client</label><input id="nomClient" type="text" name="nomClient" value={clientConfig.nomClient} onChange={handleClientChange} className="w-full bg-[#060B14] border border-slate-800/80 text-white p-3 text-sm rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" aria-label="Nom du Client" /></div>
                    <div><label htmlFor="responsable" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Responsable</label><input id="responsable" type="text" name="responsable" value={clientConfig.responsable} onChange={handleClientChange} className="w-full bg-[#060B14] border border-slate-800/80 text-white p-3 text-sm rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" aria-label="Responsable" /></div>
                    <div><label htmlFor="localisation" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Localisation</label><input id="localisation" type="text" name="localisation" value={clientConfig.localisation} onChange={handleClientChange} className="w-full bg-[#060B14] border border-slate-800/80 text-white p-3 text-sm rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" aria-label="Localisation" /></div>
                    <div><label htmlFor="referenceProjet" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Réf. Projet</label><input id="referenceProjet" type="text" name="referenceProjet" value={clientConfig.referenceProjet} onChange={handleClientChange} className="w-full bg-[#060B14] border border-slate-800/80 text-white p-3 text-sm rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" aria-label="Référence Projet" /></div>
                  </div>
                </div>

                <div className="bg-[#0F172A]/60 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl shadow-xl">
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3 border-b border-slate-800/80 pb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg"><MapPin className="w-5 h-5 text-blue-400" /></div> Paramètres Conduite
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-5">
                      <div><label htmlFor="idTroncon" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">ID Tronçon</label><input id="idTroncon" type="text" name="idTroncon" value={pipeConfig.idTroncon} onChange={handlePipeChange} className="w-full bg-[#060B14] border border-slate-800/80 text-white p-3 text-sm rounded-xl focus:border-blue-500 outline-none" aria-label="ID Tronçon" /></div>
                      <div><label htmlFor="zoneAEP" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Secteur</label><input id="zoneAEP" type="text" name="zoneAEP" value={pipeConfig.zoneAEP} onChange={handlePipeChange} className="w-full bg-[#060B14] border border-slate-800/80 text-white p-3 text-sm rounded-xl focus:border-blue-500 outline-none" aria-label="Secteur" /></div>
                    </div>
                    <div className="space-y-5">
                      <div><label htmlFor="materiau" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Matériau</label><select id="materiau" name="materiau" value={pipeConfig.materiau} onChange={handlePipeChange} className="w-full bg-[#060B14] border border-slate-800/80 text-white p-3 text-sm rounded-xl focus:border-blue-500 outline-none" aria-label="Matériau"><option value="FONTE">Fonte Ductile</option><option value="PEHD">PEHD</option><option value="PVC">PVC</option><option value="ACIER">Acier</option></select></div>
                      <div><label htmlFor="rugosite" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Rugosité (mm)</label><input id="rugosite" type="number" step="0.001" name="rugosite" value={pipeConfig.rugosite} onChange={handlePipeChange} className="w-full bg-[#060B14] border border-slate-800/80 text-cyan-300 p-3 text-sm rounded-xl focus:border-blue-500 outline-none font-mono" aria-label="Rugosité" /></div>
                    </div>
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label htmlFor="diametreNominal" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">DN</label><input id="diametreNominal" type="number" name="diametreNominal" value={pipeConfig.diametreNominal} onChange={handlePipeChange} className="w-full bg-[#060B14] border border-slate-800/80 text-white p-3 text-sm rounded-xl focus:border-blue-500 outline-none" aria-label="Diamètre Nominal" /></div>
                        <div><label htmlFor="pressionPN" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">PN</label><input id="pressionPN" type="number" name="pressionPN" value={pipeConfig.pressionPN} onChange={handlePipeChange} className="w-full bg-[#060B14] border border-slate-800/80 text-white p-3 text-sm rounded-xl focus:border-blue-500 outline-none" aria-label="Pression Nominale" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label htmlFor="altitudeAmont" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Z Amont</label><input id="altitudeAmont" type="number" name="altitudeAmont" value={pipeConfig.altitudeAmont} onChange={handlePipeChange} className="w-full bg-[#060B14] border border-slate-800/80 text-white p-3 text-sm rounded-xl focus:border-blue-500 outline-none" placeholder="m" aria-label="Altitude Amont" /></div>
                        <div><label htmlFor="altitudeAval" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Z Aval</label><input id="altitudeAval" type="number" name="altitudeAval" value={pipeConfig.altitudeAval} onChange={handlePipeChange} className="w-full bg-[#060B14] border border-slate-800/80 text-white p-3 text-sm rounded-xl focus:border-blue-500 outline-none" placeholder="m" aria-label="Altitude Aval" /></div>
                      </div>
                    </div>
                    <div className="space-y-5 flex flex-col justify-end">
                      <div><label htmlFor="debitConsigne" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Débit Cible (L/min)</label><input id="debitConsigne" type="number" name="debitConsigne" value={pipeConfig.debitConsigne} onChange={handlePipeChange} className="w-full bg-[#060B14] border border-blue-500/50 text-blue-400 p-3 text-sm rounded-xl focus:border-blue-500 outline-none font-bold text-lg" aria-label="Débit Cible" /></div>
                      <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold p-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" /> Sauvegarder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* VUE 2 : DIAGNOSTIC & MONITORING           */}
        {/* ========================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            
            {/* CARDS INDICATEURS CLÉS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-slate-700 transition-colors relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-5 h-5 text-slate-400" />
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Probabilité de Fuite</p>
                </div>
                <div className="flex items-end gap-3 mt-2">
                  <span className={`text-5xl font-black tracking-tighter ${leakProbabilityPercent !== null && leakProbabilityPercent > 70 ? 'text-transparent bg-clip-text bg-gradient-to-br from-rose-400 to-red-600' : leakProbabilityPercent !== null && leakProbabilityPercent > 30 ? 'text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-orange-500' : 'text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-green-500'}`}>
                    {leakProbabilityPercent !== null ? `${leakProbabilityPercent}%` : '--'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium pb-2">Score ML</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full mt-6 overflow-hidden border border-slate-800">
                  <div className={`h-full rounded-full transition-all duration-1000 ${leakProbabilityPercent !== null && leakProbabilityPercent > 70 ? 'bg-gradient-to-r from-red-500 to-rose-400' : leakProbabilityPercent !== null && leakProbabilityPercent > 30 ? 'bg-gradient-to-r from-orange-500 to-amber-400' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`} style={{ width: `${leakProbabilityPercent ?? 0}%` }}></div>
                </div>
              </div>

              <div className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-slate-700 transition-colors relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-3 mb-4">
                  <Droplets className="w-5 h-5 text-slate-400" />
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Volume Perdu</p>
                </div>
                <div className="flex items-end gap-3 mt-2">
                  <span className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
                    {estimatedLossVolume.toFixed(1)}
                  </span>
                  <span className="text-sm text-cyan-400 font-bold pb-2">m³/jour</span>
                </div>
                <p className="text-xs text-slate-500 mt-5 font-medium flex items-center gap-1.5"><Hash className="w-3 h-3"/> Écart dynamique (Modèle Théorique)</p>
              </div>

              <div className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-slate-400" />
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Statut Réseau</p>
                  </div>
                  <div className="mt-4">
                    {leakProbability !== null && leakProbabilityPercent !== null && leakProbabilityPercent > 70 ? (
                      <div className="bg-rose-500/10 border border-rose-500/30 px-4 py-3 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                        <AlertTriangle className="w-6 h-6 text-rose-400" />
                        <span className="text-rose-400 text-sm font-bold tracking-wide">INSPECTION REQUISE</span>
                      </div>
                    ) : leakProbability !== null ? (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 rounded-xl flex items-center justify-center gap-3">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                        <span className="text-emerald-400 text-sm font-bold tracking-wide">ÉTAT NOMINAL</span>
                      </div>
                    ) : (
                      <div className="bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-xl flex items-center justify-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-slate-400" />
                        <span className="text-slate-400 text-sm font-bold tracking-wide">EN ATTENTE DE DONNÉES</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 font-medium px-2 py-1.5 bg-slate-900/50 rounded-lg inline-flex w-fit border border-slate-800/80">Tronçon actif : <span className="text-white ml-1">{pipeConfig.idTroncon}</span></p>
              </div>
            </div>

            {/* GRAPHIQUES SÉPARÉS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl">
                <h3 className="text-cyan-400 font-bold mb-6 flex items-center gap-3 text-sm uppercase tracking-wider">
                  <div className="p-1.5 bg-cyan-500/10 rounded-md"><Droplets className="w-4 h-4" /></div> Débit (L/min)
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#475569" fontSize={10} tickMargin={12} />
                      <YAxis stroke="#475569" fontSize={10} tickMargin={8} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="flow_rate" name="Débit" unit="L/min" stroke="#22d3ee" strokeWidth={3} fill="url(#colorFlow)" dot={{ r: 0 }} activeDot={{ r: 6, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl">
                <h3 className="text-amber-400 font-bold mb-6 flex items-center gap-3 text-sm uppercase tracking-wider">
                  <div className="p-1.5 bg-amber-500/10 rounded-md"><Gauge className="w-4 h-4" /></div> Pression (bar)
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="created_at" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="#475569" fontSize={10} tickMargin={12} />
                      <YAxis stroke="#475569" fontSize={10} tickMargin={8} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="pressure" name="Pression" unit="bar" stroke="#fbbf24" strokeWidth={3} fill="url(#colorPressure)" dot={{ r: 0 }} activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* TEMPÉRATURE */}
            <div className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl">
              <h3 className="text-rose-400 font-bold mb-6 flex items-center gap-3 text-sm uppercase tracking-wider">
                <div className="p-1.5 bg-rose-500/10 rounded-md"><Thermometer className="w-4 h-4" /></div> Température (°C)
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb7185" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#475569" fontSize={10} tickMargin={12} />
                    <YAxis stroke="#475569" fontSize={10} tickMargin={8} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="temperature" name="Température" unit="°C" stroke="#fb7185" strokeWidth={3} fill="url(#colorTemp)" dot={{ r: 0 }} activeDot={{ r: 6, fill: '#fb7185', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* NOUVEAU TABLEAU DE RECHERCHE DES PERTES */}
            <LossSearchPlan />

          </div>
        )}

      </div>
    </div>
  );
}