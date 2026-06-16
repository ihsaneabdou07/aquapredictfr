import React from 'react';
import { MapPin, Search, Droplets, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

type SearchStatus = 'Critique' | 'En cours' | 'Planifié' | 'Résolu';

interface SearchZone {
  id: string;
  zoneName: string;
  method: string;
  estimatedLoss: string;
  status: SearchStatus;
  date: string;
}

const mockSearchData: SearchZone[] = [
  {
    id: "Z-104",
    zoneName: "Secteur Agricole Nord - Vanne V3",
    method: "Corrélation Acoustique",
    estimatedLoss: "15.2 L/min",
    status: "Critique",
    date: "Aujourd'hui, 08:30"
  },
  {
    id: "Z-089",
    zoneName: "Conduite Principale A1 (Enterrée)",
    method: "Inspection par Gaz Traceur",
    estimatedLoss: "~ 8.5 L/min",
    status: "En cours",
    date: "Aujourd'hui, 10:15"
  },
  {
    id: "Z-112",
    zoneName: "Raccordement Station de Pompage",
    method: "Analyse Thermographique",
    estimatedLoss: "À déterminer",
    status: "Planifié",
    date: "Demain, 09:00"
  },
  {
    id: "Z-045",
    zoneName: "Segment Industriel Est - Bride B2",
    method: "Remplacement Joint Torique",
    estimatedLoss: "0 L/min",
    status: "Résolu",
    date: "Hier, 16:45"
  }
];

const getStatusBadge = (status: SearchStatus) => {
  switch (status) {
    case 'Critique':
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200"><AlertCircle className="w-3.5 h-3.5" /> CRITIQUE</span>;
    case 'En cours':
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5" /> EN COURS</span>;
    case 'Résolu':
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> RÉSOLU</span>;
    default:
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"><Search className="w-3.5 h-3.5" /> PLANIFIÉ</span>;
  }
};

export default function LossSearchPlan({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden", className)}>
      <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-400" />
          PLAN DE RECHERCHE DES PERTES PHYSIQUES
        </h3>
        <span className="bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1 rounded-full">
          Réseau Actif
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-6 py-4">Zone d'Investigation</th>
              <th className="px-6 py-4">Méthode de Diagnostic</th>
              <th className="px-6 py-4">Perte Estimée</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">Date d'Intervention</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockSearchData.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-all">
                      <MapPin className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{row.zoneName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {row.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-700 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                    {row.method}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Droplets className={cn("w-4 h-4", row.estimatedLoss === "0 L/min" ? "text-emerald-500" : "text-blue-500")} />
                    <span className="font-mono text-sm font-bold text-slate-700">
                      {row.estimatedLoss}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(row.status)}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 font-medium">
                    {row.date}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}