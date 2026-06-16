import { AlertTriangle } from "lucide-react";

import type { HydraulicAlert } from "@/hooks/useHydraulicData";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const METRIC_LABEL: Record<string, string> = {
  debit: "Débit",
  pression: "Pression",
  temperature: "Température",
};

const METRIC_UNIT: Record<string, string> = {
  debit: "L/min",
  pression: "bar",
  temperature: "°C",
};

function fmt(n: number) {
  if (Number.isNaN(n)) return "-";
  if (Math.abs(n) >= 100) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

export default function AlertPanel({ alerts, className }: { alerts: HydraulicAlert[]; className?: string }) {
  if (!alerts?.length) return null;

  return (
    <div className={cn("grid gap-3", className)}>
      {alerts.map((a) => {
        const label = METRIC_LABEL[a.metric_name] ?? a.metric_name;
        const unit = METRIC_UNIT[a.metric_name] ?? "";
        const isCritical = String(a.severity).toLowerCase() === "critical";

        return (
          <Alert key={a.id} variant={isCritical ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <AlertTitle className="flex items-center gap-2">
                  <span>{isCritical ? "Alerte critique" : "Alerte"}</span>
                  <Badge variant={isCritical ? "destructive" : "secondary"}>
                    {label}
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  Valeur: <span className="font-mono">{fmt(Number(a.current_value))}{unit ? ` ${unit}` : ""}</span> — seuil: <span className="font-mono">{fmt(Number(a.threshold_value))}{unit ? ` ${unit}` : ""}</span>
                </AlertDescription>
              </div>
              <div className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                {new Date(a.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          </Alert>
        );
      })}
    </div>
  );
}
