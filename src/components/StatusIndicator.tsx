import { motion } from "framer-motion";
import type { DataPoint } from "@/hooks/useHydraulicData";

interface StatusIndicatorProps {
  current: DataPoint;
}

const getStatus = (current: DataPoint) => {
  if (current.pression > 4.5 || current.temperature > 55) return { label: "ALERTE", color: "bg-destructive", pulse: true };
  if (current.pression > 4 || current.temperature > 50) return { label: "ATTENTION", color: "bg-accent", pulse: true };
  return { label: "NORMAL", color: "bg-primary", pulse: false };
};

const StatusIndicator = ({ current }: StatusIndicatorProps) => {
  const status = getStatus(current);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
    >
      <div className="relative flex items-center gap-2">
        <span className={`inline-block h-3 w-3 rounded-full ${status.color} ${status.pulse ? "animate-pulse-glow" : ""}`} />
        <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
          {status.label}
        </span>
      </div>
      <span className="text-xs text-muted-foreground font-mono">
        {current.time}
      </span>
    </motion.div>
  );
};

export default StatusIndicator;
