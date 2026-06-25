import { useState, useEffect, useCallback, useRef } from "react";

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
    debit: 0,
    pression: 3.2,
    temperature: 18.5,
  });

  const [alerts, setAlerts] = useState<HydraulicAlert[]>([]);

  useEffect(() => {
    const socket = new WebSocket("ws://10.100.10.30:3001");

    socket.onopen = () => {
      console.log("✅ WebSocket connecté");
    };

    socket.onmessage = (event) => {
      console.log("📡 DATA:", event.data);
      try {
        const data = JSON.parse(event.data);

        const flow =
          data?.data?.flow_rate ??
          data.flow_rate ??
          data.flow ??
          0;

        setCurrent((prev) => {
          const now = new Date();

          const point: DataPoint = {
            time: now.toLocaleTimeString("fr-FR"),
            timestamp: now.getTime(),
            debit: flow,
            pression: prev.pression,
            temperature: prev.temperature,
          };

          setHistory((h) => [...h.slice(-29), point]);
          setAlerts(buildLocalAlerts(point));

          return point;
        });

      } catch (err) {
        console.log("Erreur JSON:", err);
      }
    };

    socket.onclose = () => {
      console.log("❌ WebSocket fermé");
    };

    return () => socket.close();
  }, []);

  return {
    current,
    history,
    alerts
  };
};