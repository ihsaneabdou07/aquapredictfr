import { useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Droplets, Gauge, Thermometer, LayoutGrid, Layers } from "lucide-react";
import type { DataPoint } from "@/hooks/useHydraulicData";

interface HistoryChartProps {
  data: DataPoint[];
}

type MetricKey = "debit" | "pression" | "temperature";

interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  icon: React.ReactNode;
  domain: [number, number];
}

const METRICS: MetricConfig[] = [
  { key: "debit", label: "Débit", unit: "L/min", color: "hsl(185, 72%, 48%)", icon: <Droplets className="h-3.5 w-3.5" />, domain: [0, 200] },
  { key: "pression", label: "Pression", unit: "bar", color: "hsl(38, 92%, 55%)", icon: <Gauge className="h-3.5 w-3.5" />, domain: [0, 6] },
  { key: "temperature", label: "Température", unit: "°C", color: "hsl(0, 72%, 55%)", icon: <Thermometer className="h-3.5 w-3.5" />, domain: [0, 80] },
];

type ViewMode = "overlay" | "subplots";

const HistoryChart = ({ data }: HistoryChartProps) => {
  const [selected, setSelected] = useState<MetricKey[]>(["debit", "pression", "temperature"]);
  const [viewMode, setViewMode] = useState<ViewMode>("overlay");

  const toggleMetric = (key: MetricKey) => {
    setSelected((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const selectedMetrics = METRICS.filter((m) => selected.includes(m.key));

  const chartStyle = {
    grid: "hsl(210, 15%, 18%)",
    axis: "hsl(210, 10%, 50%)",
    tooltipBg: "hsl(210, 22%, 12%)",
    tooltipBorder: "hsl(210, 15%, 20%)",
    text: "hsl(195, 20%, 90%)",
  };

  const renderSingleChart = (metrics: MetricConfig[], height: number) => {
    const useRightAxis = metrics.length === 2;
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartStyle.grid} />
          <XAxis
            dataKey="time"
            stroke={chartStyle.axis}
            fontSize={11}
            fontFamily="JetBrains Mono"
            tick={{ fill: chartStyle.axis }}
          />
          <YAxis
            yAxisId="left"
            stroke={metrics[0].color}
            fontSize={11}
            fontFamily="JetBrains Mono"
            tick={{ fill: metrics[0].color }}
            domain={metrics[0].domain}
            label={{ value: metrics[0].unit, angle: -90, position: "insideLeft", fill: metrics[0].color, fontSize: 10 }}
          />
          {useRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={metrics[1].color}
              fontSize={11}
              fontFamily="JetBrains Mono"
              tick={{ fill: metrics[1].color }}
              domain={metrics[1].domain}
              label={{ value: metrics[1].unit, angle: 90, position: "insideRight", fill: metrics[1].color, fontSize: 10 }}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: chartStyle.tooltipBg,
              border: `1px solid ${chartStyle.tooltipBorder}`,
              borderRadius: "8px",
              fontFamily: "JetBrains Mono",
              fontSize: 12,
              color: chartStyle.text,
            }}
          />
          {metrics.map((m, i) => (
            <Line
              key={m.key}
              yAxisId={useRightAxis && i === 1 ? "right" : "left"}
              type="monotone"
              dataKey={m.key}
              name={`${m.label} (${m.unit})`}
              stroke={m.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-lg border border-border bg-card p-6 glow-primary"
    >
      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Historique en temps réel
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric toggles */}
          {METRICS.map((m) => {
            const isActive = selected.includes(m.key);
            return (
              <button
                key={m.key}
                onClick={() => toggleMetric(m.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium transition-all border ${
                  isActive
                    ? "border-current bg-current/10"
                    : "border-border bg-secondary text-muted-foreground opacity-50 hover:opacity-75"
                }`}
                style={isActive ? { color: m.color, borderColor: m.color } : {}}
                aria-label={m.label}
              >
                {m.icon}
                {m.label}
              </button>
            );
          })}

          {/* Separator */}
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

          {/* View mode */}
          <button
            onClick={() => setViewMode("overlay")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-mono transition-all border ${
              viewMode === "overlay"
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
            title="Superposé"
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("subplots")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-mono transition-all border ${
              viewMode === "subplots"
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
            title="Subplots"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Charts */}
      {viewMode === "overlay" ? (
        <div className="h-[300px]">
          {renderSingleChart(selectedMetrics, 300)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {selectedMetrics.map((m) => (
            <div key={m.key}>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-mono" style={{ color: m.color }} aria-label={`${m.label} (${m.unit})`}>
                {m.icon}
                {m.label} ({m.unit})
              </div>
              <div className="h-[180px]">
                {renderSingleChart([m], 180)}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default HistoryChart;
