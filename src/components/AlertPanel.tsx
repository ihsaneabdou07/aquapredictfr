import React from 'react';
import { AlertCircle, AlertTriangle, Info, Wrench } from 'lucide-react';
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
  alerts: HydraulicAlert[];
  className?: string;
}

// Logique de design dynamique et impactant
const getAlertStyles = (severity: AlertSeverity) => {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50 border-red-600 shadow-md',
        text: 'text-red-900',
        icon: <AlertCircle className="w-8 h-8 text-red-600 animate-pulse shrink-0" />,
        badge: 'bg-red-600 text-white shadow-sm'
      };
    case 'warning':
      return {
        bg: 'bg-amber-50 border-amber-500 shadow-sm',
        text: 'text-amber-900',
        icon: <AlertTriangle className="w-8 h-8 text-amber-550 shrink-0" />,
        badge: 'bg-amber-500 text-white shadow-sm'
      };
    default:
      return {
        bg: 'bg-blue-50 border-blue-500 shadow-sm',
        text: 'text-blue-900',
        icon: <Info className="w-8 h-8 text-blue-600 shrink-0" />,
        badge: 'bg-blue-600 text-white shadow-sm'
      };
  }
};

// Composant Principal
export default function AlertPanel({ alerts, className }: AlertPanelProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className={cn("p-8 bg-emerald-50 border-2 border-emerald-200 rounded-xl shadow-sm text-center", className)}>
        <div className="flex items-center justify-center gap-3 text-emerald-700 mb-2">
          <span className="text-2xl">✅</span>
          <span className="font-bold text-xl tracking-wide">Infrastructure Stable</span>
        </div>
        <p className="text-emerald-700 font-medium text-sm">
          Aucune perte d'eau opérationnelle détectée. Efficacité du réseau optimale.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 border-b pb-2">
        Journal de Diagnostic
        <span className="bg-gray-800 text-white text-xs font-bold py-1 px-3 rounded-full shadow-sm">
          {alerts.length} alerte(s) active(s)
        </span>
      </h3>
      
      <div className="flex flex-col gap-4">
        {alerts.map((alert) => {
          const styles = getAlertStyles(alert.severity);

          return (
            <div 
              key={alert.id} 
              className={`p-5 border-l-[6px] rounded-r-xl transition-all ${styles.bg}`}
            >
              {/* En-tête de l'alerte */}
              <div className="flex items-start gap-4">
                <div className="pt-1">{styles.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-md tracking-wider ${styles.badge}`}>
                      {alert.severity}
                    </span>
                    <span className="text-sm text-gray-600 font-mono font-bold bg-white/50 px-2 py-1 rounded">
                      {alert.timestamp}
                    </span>
                  </div>
                  
                  <p className={`font-bold text-base leading-snug ${styles.text}`}>
                    {alert.message}
                  </p>
                </div>
              </div>

              {/* Panneau d'action recommandée (Haute visibilité) */}
              <div className="mt-4 ml-12 p-4 bg-white rounded-lg border border-gray-200 shadow-inner flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-full shrink-0">
                  <Wrench className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-800 uppercase tracking-widest block mb-1">
                    Action Opérationnelle Requise
                  </span>
                  <span className="text-base text-gray-800 font-medium">
                    {alert.recommendedAction}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}