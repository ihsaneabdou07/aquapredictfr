import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DataPoint {
  time: string;
  timestamp: number;
  debit: number;
  pression: number;
  temperature: number;
}

export type AlertSeverity = "warning" | "critical";
export type MetricName = "debit" | "pression" | "temperature";

export interface HydraulicAlert {
  id: string;
  metric_name: MetricName | string;
  alert_type: string;
  current_value: number;
  threshold_value: number;
  severity: AlertSeverity | string;
  timestamp: string;
}

interface HydraulicAlertRaw {
  id?: string | number;
  metric_name?: string;
  alert_type?: string;
  current_value?: unknown;
  threshold_value?: unknown;
  severity?: string;
  timestamp?: string;
}

interface HydraulicDataRaw {
  timestamp: string;
  debit: unknown;
  pression: unknown;
  temperature: unknown;
}

interface HydraulicApiResponse {
  data?: HydraulicDataRaw[];
  alerts?: HydraulicAlertRaw[];
}

const generateValue = (base: number, range: number, t: number, freq: number) =>
  base + Math.sin(t * freq) * range * 0.6 + (Math.random() - 0.5) * range * 0.4;

const THRESHOLDS: Record<MetricName, { warning_high: number; critical_high: number; warning_low?: number; critical_low?: number }> = {
  debit: { warning_high: 160, critical_high: 180, warning_low: 40, critical_low: 25 },
  pression: { warning_high: 4.6, critical_high: 5.2, warning_low: 1.2, critical_low: 0.8 },
  temperature: { warning_high: 60, critical_high: 70, warning_low: 5, critical_low: 2 },
};

const coerceNumber = (v: unknown) => (typeof v === "number" ? v : Number(v));

const buildLocalAlerts = (point: DataPoint): HydraulicAlert[] => {
  const ts = new Date(point.timestamp).toISOString();
  const alerts: HydraulicAlert[] = [];

  (Object.keys(THRESHOLDS) as MetricName[]).forEach((metric) => {
    const v = point[metric];
    const t = THRESHOLDS[metric];

    if (typeof t.critical_low === "number" && v <= t.critical_low) {
      alerts.push({
        id: `${metric}:threshold_low`,
        metric_name: metric,
        alert_type: "threshold_low",
        current_value: v,
        threshold_value: t.critical_low,
        severity: "critical",
        timestamp: ts,
      });
      return;
    }

    if (typeof t.warning_low === "number" && v <= t.warning_low) {
      alerts.push({
        id: `${metric}:threshold_low`,
        metric_name: metric,
        alert_type: "threshold_low",
        current_value: v,
        threshold_value: t.warning_low,
        severity: "warning",
        timestamp: ts,
      });
      return;
    }

    if (v >= t.critical_high) {
      alerts.push({
        id: `${metric}:threshold_high`,
        metric_name: metric,
        alert_type: "threshold_high",
        current_value: v,
        threshold_value: t.critical_high,
        severity: "critical",
        timestamp: ts,
      });
      return;
    }

    if (v >= t.warning_high) {
      alerts.push({
        id: `${metric}:threshold_high`,
        metric_name: metric,
        alert_type: "threshold_high",
        current_value: v,
        threshold_value: t.warning_high,
        severity: "warning",
        timestamp: ts,
      });
    }
  });

  return alerts;
};

export const useHydraulicData = () => {
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [current, setCurrent] = useState<DataPoint>({
    time: "",
    timestamp: Date.now(),
    debit: 125,
    pression: 3.2,
    temperature: 42,
  });

  const [alerts, setAlerts] = useState<HydraulicAlert[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(true); // Par défaut en mode simulation
  const initialized = useRef(false);

  const generatePoint = useCallback((t: number): DataPoint => {
    const now = new Date();
    return {
      time: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      timestamp: now.getTime(),
      debit: Math.round(generateValue(120, 40, t, 0.3) * 10) / 10,
      pression: Math.round(generateValue(3.5, 1.5, t, 0.2) * 100) / 100,
      temperature: Math.round(generateValue(45, 15, t, 0.15) * 10) / 10,
    };
  }, []);

  const normalizeAlertsFromApi = useCallback((raw: HydraulicAlertRaw[] | unknown): HydraulicAlert[] => {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((a) => ({
        id: String(a.id ?? `${a.metric_name}:${a.alert_type}`),
        metric_name: String(a.metric_name ?? ""),
        alert_type: String(a.alert_type ?? ""),
        current_value: coerceNumber(a.current_value),
        threshold_value: coerceNumber(a.threshold_value),
        severity: String(a.severity ?? "warning"),
        timestamp: String(a.timestamp ?? new Date().toISOString()),
      }))
      .filter((a) => a.metric_name && a.alert_type);
  }, []);

  // Fonction pour récupérer les données réelles depuis l'API
  const fetchRealData = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("hydraulic-data-receiver", {
        method: "GET",
      });

      if (error) {
        console.error("Erreur lors de la récupération des données:", error);
        return null;
      }

      return data as HydraulicApiResponse;
    } catch (error) {
      console.error("Erreur réseau:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      // Initialize with 30 points
      const now = Date.now();
      const initial: DataPoint[] = [];
      for (let i = 29; i >= 0; i--) {
        const t = (now - i * 2000) / 1000;
        const d = new Date(now - i * 2000);
        initial.push({
          ...generatePoint(t),
          time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          timestamp: d.getTime(),
        });
      }
      setHistory(initial);
      setCurrent(initial[initial.length - 1]);
      setAlerts(buildLocalAlerts(initial[initial.length - 1]));
      initialized.current = true;
    }

    if (isPaused) return;

    const interval = setInterval(async () => {
      if (isSimulationMode) {
        // Mode simulation (données générées)
        const t = Date.now() / 1000;
        const point = generatePoint(t);
        setCurrent(point);
        setHistory((prev) => [...prev.slice(-29), point]);
        setAlerts(buildLocalAlerts(point));
      } else {
        // Mode réel (données depuis l'API)
        const realData = await fetchRealData();
        if (realData?.data && realData.data.length > 0) {
          const latestPoint = realData.data[0];
          const point: DataPoint = {
            time: new Date(latestPoint.timestamp).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            timestamp: new Date(latestPoint.timestamp).getTime(),
            debit: coerceNumber(latestPoint.debit),
            pression: coerceNumber(latestPoint.pression),
            temperature: coerceNumber(latestPoint.temperature),
          };
          setCurrent(point);
          setHistory((prev) => [...prev.slice(-29), point]);
        }

        // Alertes actives calculées côté backend (fallback côté client si non présent)
        const normalized = normalizeAlertsFromApi(realData?.alerts);
        if (normalized.length > 0) {
          setAlerts(normalized);
        } else if (realData?.data?.[0]) {
          const lp = realData.data[0];
          const fallbackPoint: DataPoint = {
            time: "",
            timestamp: new Date(lp.timestamp).getTime(),
            debit: coerceNumber(lp.debit),
            pression: coerceNumber(lp.pression),
            temperature: coerceNumber(lp.temperature),
          };
          setAlerts(buildLocalAlerts(fallbackPoint));
        } else {
          setAlerts([]);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [generatePoint, isPaused, isSimulationMode, fetchRealData, normalizeAlertsFromApi]);

  return {
    current,
    history,
    alerts,
    isPaused,
    setIsPaused,
    isSimulationMode,
    setIsSimulationMode,
  };
};
