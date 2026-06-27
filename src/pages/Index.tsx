import { useEffect, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Activity, Droplets, Gauge, Thermometer, AlertTriangle, CheckCircle, 
  Settings, Search, MapPin, User, Hash, HardDrive, ShieldCheck, Download, Zap, Database
} from 'lucide-react';

import { NetworkMap } from '@/components/NetworkMap';

interface SectionResult {
  id: number;
  flow: number;
  pressure: number;
  temperature: number;
  leak_probability: number;
  alert: boolean;
}

interface PredictResult {
  sections: SectionResult[];
  leak_probability: number;
  leak_section: number | null;
  alert_sections: number[];
}

interface SensorData {
  id: string;
  created_at: number;
  flow1: number;
  flow2: number;
  flow3: number;
  pressure1: number;
  pressure2: number;
  pressure3: number;
  temperature: number;
  is_leak_alert: boolean;
  leak_probability?: number;
  sections?: SectionResult[];
  alert_sections?: number[];
  leak_section?: number | null;
}

const LOCAL_SVM_API_URL = "http://127.0.0.1:8000/predict";

async function fetchPrediction(
  flow1: number, flow2: number, flow3: number,
  pressure1: number, pressure2: number, pressure3: number,
  temp: number
): Promise<PredictResult | undefined> {
  try {
    const response = await fetch(LOCAL_SVM_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flow1, flow2, flow3, pressure1, pressure2, pressure3, temp }),
    });
    if (!response.ok) {
      console.error("Erreur SVM API", response.status);
      return undefined;
    }
    return await response.json() as PredictResult;
  } catch (err) {
    console.error("Erreur appel SVM:", err);
    return undefined;
  }
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
  const [wsStatus, setWsStatus] = useState<string>('En attente de connexion');
  const [sections, setSections] = useState<SectionResult[]>([]);
  const [alertSections, setAlertSections] = useState<number[]>([]);
  const [leakSection, setLeakSection] = useState<number | null>(null);

  const [clientConfig, setClientConfig] = useState({ nomClient: '', responsable: '', localisation: '', referenceProjet: '' });
  const [pipeConfig, setPipeConfig] = useState({
    idTroncon: 'TR-Z1-042', zoneAEP: 'Secteur Centre-Ville', materiau: 'FONTE', diametreNominal: '150',
    longueur: '1200', rugosite: '0.1', pressionPN: '16', debitConsigne: '40', altitudeAmont: '', altitudeAval: ''
  });
  const pipeConfigRef = useRef(pipeConfig);

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

  const last = data[data.length - 1];
  const currentFlow1 = last?.flow1 || 0;
  const currentFlow2 = last?.flow2 || 0;
  const currentFlow3 = last?.flow3 || 0;
  const currentPressure1 = last?.pressure1 || 0;
  const currentPressure2 = last?.pressure2 || 0;
  const currentPressure3 = last?.pressure3 || 0;
  const currentTemperature = last?.temperature || 0;
  const lastMeasurementTime = last?.created_at ? formatTime(String(last.created_at)) : 'N/A';
  const effectiveLeakProbability = leakProbability;
  const effectiveLeakProbabilityPercent = effectiveLeakProbability !== null ? Math.round(effectiveLeakProbability * 100) : null;

  const leakPredictionHorizon = (() => {
    if (effectiveLeakProbability === null) {
      return {
        title: 'En attente du modèle SVM',
        description: 'Aucune estimation disponible tant que le modèle ne renvoie pas de probabilité.',
      };
    }
    if (effectiveLeakProbability >= 0.85) {
      return {
        title: 'Fuite imminente',
        description: 'Probabilité très élevée de fuite dans les 6 prochaines heures.',
      };
    }
    if (effectiveLeakProbability >= 0.7) {
      return {
        title: 'Risque élevé',
        description: 'Fuite probable dans les 12 prochaines heures.',
      };
    }
    if (effectiveLeakProbability >= 0.5) {
      return {
        title: 'Surveillance renforcée',
        description: 'Risque de fuite élevé dans les prochaines 24 heures.',
      };
    }
    if (effectiveLeakProbability >= 0.3) {
      return {
        title: 'Surveillance requise',
        description: 'Risque modéré de fuite dans les prochaines 48 heures.',
      };
    }
    return {
      title: 'Réseau stable',
      description: 'Aucune fuite anticipée dans les prochaines 48 heures.',
    };
  })();

  const networkStatus = (() => {
    if (effectiveLeakProbability === null) {
      return { state: 'pending', label: 'EN ATTENTE DE DONNÉES' };
    }
    if (effectiveLeakProbability >= 0.85) {
      return { state: 'critical', label: 'FUITE IMMINENTE' };
    }
    if (effectiveLeakProbability >= 0.7) {
      return { state: 'warning', label: 'RISQUE ÉLEVÉ' };
    }
    if (effectiveLeakProbability >= 0.5) {
      return { state: 'info', label: 'SURVEILLANCE RENFORCÉE' };
    }
    return { state: 'normal', label: 'ÉTAT NOMINAL' };
  })();

useEffect(() => {
  const socketHost = import.meta.env.VITE_WS_HOST ?? window.location.hostname ?? 'localhost';
  const socket = new WebSocket(`ws://${socketHost}:3001`);

  socket.onopen = () => {
    console.log("✅ Connected WebSocket");
    setWsStatus(`Connecté au serveur de mesure (${socketHost})`);
  };

  socket.onmessage = async (event) => {
    console.log("📡 RAW:", event.data);

    try {
      const json = JSON.parse(event.data);

      const flow1 = json.flow1 ?? 0;
      const flow2 = json.flow2 ?? 0;
      const flow3 = json.flow3 ?? 0;
      const pressure1 = json.pressure1 ?? 0;
      const pressure2 = json.pressure2 ?? 0;
      const pressure3 = json.pressure3 ?? 0;
      const temperature = json.temperature ?? json.temp ?? 18.5;

      const now = new Date().getTime();

      const prediction = await fetchPrediction(
        flow1, flow2, flow3,
        pressure1, pressure2, pressure3,
        temperature
      );

      const newPoint: SensorData = {
        id: Math.random().toString(),
        created_at: now,
        flow1, flow2, flow3,
        pressure1, pressure2, pressure3,
        temperature,
        is_leak_alert: prediction !== undefined && prediction.alert_sections.length > 0,
        ...(prediction ? {
          leak_probability: prediction.leak_probability,
          sections: prediction.sections,
          alert_sections: prediction.alert_sections,
          leak_section: prediction.leak_section,
        } : {}),
      };

      if (prediction && prediction.alert_sections.length > 0) {
        const sectionLabel = prediction.alert_sections.map(s => `Section ${s}`).join(', ');
        console.log(`🚨 Fuite détectée — ${sectionLabel}`);
        fetch("http://localhost:4000/alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Fuite détectée — ${sectionLabel}`,
            probability: prediction.leak_probability,
            sections: prediction.alert_sections,
            leak_section: prediction.leak_section,
            time: new Date().toISOString(),
          }),
        });
      }

      setData((prev) => [...prev, newPoint].slice(-30));
      if (prediction) {
        setLeakProbability(prediction.leak_probability);
        setAlertActive(prediction.alert_sections.length > 0);
        setSections(prediction.sections);
        setAlertSections(prediction.alert_sections);
        setLeakSection(prediction.leak_section);
      }

    } catch (e) {
      console.log("❌ JSON error", e);
    }
  };

  socket.onerror = (err) => {
    console.error("❌ WS ERROR:", err);
    setWsStatus('Erreur de connexion au serveur de mesure');
  };

  socket.onclose = () => {
    console.log("❌ WS closed");
    setWsStatus('Connexion au serveur de mesure fermée');
  };

  return () => socket.close();
}, []);

useEffect(() => {
  const alertSocket = new WebSocket("ws://localhost:4001");

  alertSocket.onmessage = (event) => {
    const alert = JSON.parse(event.data);

    alert("🚨 ALERTE CLIENT:\n" + alert.message);

    console.log("ALERTE REÇUE:", alert);
  };

  return () => alertSocket.close();
}, []);
useEffect(() => {
  const user = localStorage.getItem("user");

  if (!user) {
    window.location.href = "/login";
  }
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
          
          <div className="flex flex-col gap-3 items-end">
            <div className="text-xs text-slate-400 uppercase tracking-[0.2em] px-3 py-2 rounded-full bg-slate-800/70 border border-slate-700">
              {wsStatus}
            </div>
            <div className="flex items-center gap-3">
              {alertActive ? (
                <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 px-5 py-2.5 rounded-xl font-bold animate-pulse flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    FUITE SUSPECTÉE
                  </div>
                  <div className="text-sm text-slate-200">
                    Probabilité : {leakProbability !== null ? `${(leakProbability*100).toFixed(1)}%` : 'En attente'}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-2.5 rounded-xl font-medium flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5" />
                    Réseau Nominal
                  </div>
                  <div className="text-sm text-slate-200">
                    Probabilité : {leakProbability !== null ? `${(leakProbability*100).toFixed(1)}%` : 'En attente'}
                  </div>
                </div>
              )}
            </div>
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
                  <span className={`text-5xl font-black tracking-tighter ${effectiveLeakProbabilityPercent !== null && effectiveLeakProbabilityPercent > 70 ? 'text-transparent bg-clip-text bg-gradient-to-br from-rose-400 to-red-600' : effectiveLeakProbabilityPercent !== null && effectiveLeakProbabilityPercent > 30 ? 'text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-orange-500' : 'text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-green-500'}`}>
                    {effectiveLeakProbabilityPercent !== null ? `${effectiveLeakProbabilityPercent}%` : '--'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium pb-2">Score ML</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full mt-4 overflow-hidden border border-slate-800">
                  <div className={`h-full rounded-full transition-all duration-1000 ${effectiveLeakProbabilityPercent !== null && effectiveLeakProbabilityPercent > 70 ? 'bg-gradient-to-r from-red-500 to-rose-400' : effectiveLeakProbabilityPercent !== null && effectiveLeakProbabilityPercent > 30 ? 'bg-gradient-to-r from-orange-500 to-amber-400' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`} style={{ width: `${effectiveLeakProbabilityPercent ?? 0}%` }}></div>
                </div>
              </div>

              <div className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-3 mb-4">
                  <Droplets className="w-5 h-5 text-slate-400" />
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Horizon de Fuite</p>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-black text-white tracking-tighter">
                    {leakPredictionHorizon.title}
                  </span>
                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                    {leakPredictionHorizon.description}
                  </p>
                </div>
              </div>

              <div className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-slate-400" />
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Statut Réseau</p>
                  </div>
                  <div className="mt-4">
                    {networkStatus.state === 'critical' ? (
                      <div className="bg-rose-500/10 border border-rose-500/30 px-4 py-3 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                        <AlertTriangle className="w-6 h-6 text-rose-400" />
                        <span className="text-rose-400 text-sm font-bold tracking-wide">{networkStatus.label}</span>
                      </div>
                    ) : networkStatus.state === 'warning' ? (
                      <div className="bg-orange-500/10 border border-orange-500/30 px-4 py-3 rounded-xl flex items-center justify-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-orange-300" />
                        <span className="text-orange-300 text-sm font-bold tracking-wide">{networkStatus.label}</span>
                      </div>
                    ) : networkStatus.state === 'info' ? (
                      <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-3 rounded-xl flex items-center justify-center gap-3">
                        <CheckCircle className="w-6 h-6 text-amber-300" />
                        <span className="text-amber-300 text-sm font-bold tracking-wide">{networkStatus.label}</span>
                      </div>
                    ) : networkStatus.state === 'normal' ? (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 rounded-xl flex items-center justify-center gap-3">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                        <span className="text-emerald-400 text-sm font-bold tracking-wide">{networkStatus.label}</span>
                      </div>
                    ) : (
                      <div className="bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-xl flex items-center justify-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-slate-400" />
                        <span className="text-slate-400 text-sm font-bold tracking-wide">{networkStatus.label}</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 font-medium px-2 py-1.5 bg-slate-900/50 rounded-lg inline-flex w-fit border border-slate-800/80">Tronçon actif : <span className="text-white ml-1">{pipeConfig.idTroncon}</span></p>
              </div>
            </div>

            {/* RELEVÉ TEMPS RÉEL — 6 CAPTEURS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Débit C1', value: currentFlow1, unit: 'L/min', color: 'cyan', dot: 'bg-cyan-400' },
                { label: 'Débit C2', value: currentFlow2, unit: 'L/min', color: 'blue', dot: 'bg-blue-400' },
                { label: 'Débit C3', value: currentFlow3, unit: 'L/min', color: 'indigo', dot: 'bg-indigo-400' },
                { label: 'Pression C1', value: currentPressure1, unit: 'bar', color: 'amber', dot: 'bg-amber-400' },
                { label: 'Pression C2', value: currentPressure2, unit: 'bar', color: 'orange', dot: 'bg-orange-400' },
                { label: 'Pression C3', value: currentPressure3, unit: 'bar', color: 'yellow', dot: 'bg-yellow-300' },
              ].map(({ label, value, unit, dot }) => (
                <div key={label} className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-md flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot} shrink-0`}></span>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold truncate">{label}</p>
                  </div>
                  <p className="text-xl font-black text-white font-mono">{value.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-500">{unit}</p>
                </div>
              ))}
            </div>

            {/* GRAPHIQUES SÉPARÉS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-cyan-400 font-bold flex items-center gap-3 text-sm uppercase tracking-wider">
                    <div className="p-1.5 bg-cyan-500/10 rounded-md"><Droplets className="w-4 h-4" /></div> Débit (L/min)
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>C1</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>C2</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span>C3</span>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFlow1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorFlow2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorFlow3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#475569" fontSize={10} tickMargin={12} />
                      <YAxis stroke="#475569" fontSize={10} tickMargin={8} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="flow1" name="Débit C1" unit="L/min" stroke="#22d3ee" strokeWidth={2} fill="url(#colorFlow1)" dot={{ r: 0 }} activeDot={{ r: 5, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="flow2" name="Débit C2" unit="L/min" stroke="#60a5fa" strokeWidth={2} fill="url(#colorFlow2)" dot={{ r: 0 }} activeDot={{ r: 5, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="flow3" name="Débit C3" unit="L/min" stroke="#818cf8" strokeWidth={2} fill="url(#colorFlow3)" dot={{ r: 0 }} activeDot={{ r: 5, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-amber-400 font-bold flex items-center gap-3 text-sm uppercase tracking-wider">
                    <div className="p-1.5 bg-amber-500/10 rounded-md"><Gauge className="w-4 h-4" /></div> Pression (bar)
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>C1</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>C2</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-300 inline-block"></span>C3</span>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPressure1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPressure2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fb923c" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPressure3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fde047" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#fde047" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="created_at" tickFormatter={formatTime} stroke="#475569" fontSize={10} tickMargin={12} />
                      <YAxis stroke="#475569" fontSize={10} tickMargin={8} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="pressure1" name="Pression C1" unit="bar" stroke="#fbbf24" strokeWidth={2} fill="url(#colorPressure1)" dot={{ r: 0 }} activeDot={{ r: 5, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="pressure2" name="Pression C2" unit="bar" stroke="#fb923c" strokeWidth={2} fill="url(#colorPressure2)" dot={{ r: 0 }} activeDot={{ r: 5, fill: '#fb923c', stroke: '#fff', strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="pressure3" name="Pression C3" unit="bar" stroke="#fde047" strokeWidth={2} fill="url(#colorPressure3)" dot={{ r: 0 }} activeDot={{ r: 5, fill: '#fde047', stroke: '#fff', strokeWidth: 2 }} />
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

            {/* CARTE DU RÉSEAU HYDRAULIQUE */}
            <div className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Carte du réseau</p>
                  <h3 className="text-lg font-bold text-white">Réseau hydraulique</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${leakProbability !== null && leakProbability > 0.5 ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}`}>
                  {leakProbability !== null ? (leakProbability > 0.5 ? 'Fuite détectée' : 'Stabilité confirmée') : 'En attente de données'}
                </span>
              </div>
              <NetworkMap leakDetected={leakProbability !== null && leakProbability > 0.5} />
            </div>

          </div>
        )}

      </div>
    </div>
  );
}