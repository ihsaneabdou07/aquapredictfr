import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, Wrench, CheckCheck, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

// 1. Définition des niveaux de gravité
export type AlertSeverity = 'info' | 'warning' | 'critical';

// 2. Structure exacte d'une alerte
export interface HydraulicAlert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  message: string;
  recommendedAction: string;
}

interface AlertPanelProps {
  alerts?: HydraulicAlert[];
  className?: string;
}

// Logique de design dynamique selon l'état d'acquittement
const getAlertStyles = (severity: AlertSeverity, isAcknowledged: boolean) => {
  if (isAcknowledged) {
    return {
      bg: 'bg-slate-100 border-slate-300 shadow-none opacity-70',
      text: 'text-slate-600',
      icon: <CheckCircle2 className="w-8 h-8 text-slate-400 shrink-0" />,
      badge: 'bg-slate-400 text-white',
      badgeText: 'ACQUITTÉ'
    };
  }

  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50 border-red-600 shadow-md',
        text: 'text-red-900',
        icon: <AlertCircle className="w-8 h-8 text-red-600 animate-pulse shrink-0" />,
        badge: 'bg-red-600 text-white shadow-sm',
        badgeText: 'CRITIQUE'
      };
    case 'warning':
      return {
        bg: 'bg-amber-50 border-amber-500 shadow-sm',
        text: 'text-amber-900',
        icon: <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />,
        badge: 'bg-amber-500 text-white shadow-sm',
        badgeText: 'AVERTISSEMENT'
      };
    default:
      return {
        bg: 'bg-blue-50 border-blue-500 shadow-sm',
        text: 'text-blue-900',
        icon: <Info className="w-8 h-8 text-blue-600 shrink-0" />,
        badge: 'bg-blue-600 text-white shadow-sm',
        badgeText: 'INFO'
      };
  }
};

// Composant Principal
export default function AlertPanel({ alerts = [], className }: AlertPanelProps) {
  // MÉMOIRE : Liste des IDs des alertes qui ont été acquittées par l'opérateur
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  // Fonction déclenchée au clic sur le bouton
  const handleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  if (alerts.length === 0) {
    return (
      <div className={cn("p-8 bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 rounded-3xl shadow-xl text-center", className)}>
        <div className="flex items-center justify-center gap-3 text-emerald-400 mb-2">
          <CheckCircle2 className="w-8 h-8" />
          <span className="font-bold text-xl tracking-wide">Réseau Nominal</span>
        </div>
        <p className="text-slate-400 font-medium text-sm">
          Aucune anomalie hydraulique détectée sur ce tronçon.
        </p>
      </div>
    );
  }

  // Calcul du nombre d'alertes restantes à traiter
  const activeAlertsCount = alerts.length - acknowledgedIds.size;

  return (
    <div className={cn("space-y-5", className)}>
      <h3 className="text-xl font-bold text-white flex items-center gap-3 border-b border-slate-800 pb-3">
        Journal des Alarmes SCADA
        {activeAlertsCount > 0 ? (
          <span className="bg-rose-500 text-white text-xs font-bold py-1 px-3 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse">
            {activeAlertsCount} action(s) requise(s)
          </span>
        ) : (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold py-1 px-3 rounded-full">
            Tout est traité
          </span>
        )}
      </h3>
      
      <div className="flex flex-col gap-4">
        {alerts.map((alert) => {
          const isAcknowledged = acknowledgedIds.has(alert.id);
          const styles = getAlertStyles(alert.severity, isAcknowledged);

          return (
            <div 
              key={alert.id} 
              className={`p-5 border-l-[6px] rounded-r-xl transition-all duration-500 ${styles.bg}`}
            >
              {/* En-tête de l'alerte */}
              <div className="flex items-start gap-4">
                <div className="pt-1">{styles.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-md tracking-wider ${styles.badge}`}>
                      {styles.badgeText}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-bold bg-white/50 px-2 py-1 rounded">
                      {alert.timestamp}
                    </span>
                  </div>
                  
                  <p className={`font-bold text-base leading-snug ${styles.text}`}>
                    {alert.message}
                  </p>
                </div>
              </div>

              {/* Bloc Action + Bouton d'Acquittement */}
              <div className="mt-4 flex flex-col md:flex-row gap-3 ml-0 md:ml-12">
                
                {/* Recommandation */}
                <div className={`flex-1 p-4 rounded-lg border flex items-start gap-3 ${isAcknowledged ? 'bg-slate-50 border-slate-200' : 'bg-white border-gray-200 shadow-inner'}`}>
                  <div className="p-2 bg-gray-100 rounded-full shrink-0">
                    <Wrench className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                      Action Recommandée
                    </span>
                    <span className={`text-sm font-medium ${isAcknowledged ? 'text-gray-500' : 'text-gray-800'}`}>
                      {alert.recommendedAction}
                    </span>
                  </div>
                </div>

                {/* Le Bouton Industriel */}
                {!isAcknowledged ? (
                  <button 
                    onClick={() => handleAcknowledge(alert.id)}
                    className="shrink-0 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 border border-slate-600 active:scale-95"
                  >
                    <CheckCheck className="w-5 h-5" />
                    Acquitter l'alarme
                  </button>
                ) : (
                  <div className="shrink-0 bg-slate-200 text-slate-500 font-bold py-3 px-6 rounded-lg border border-slate-300 flex items-center justify-center gap-2 cursor-default">
                    <CheckCircle2 className="w-5 h-5" />
                    Prise en charge
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}