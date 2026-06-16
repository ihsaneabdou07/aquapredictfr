import { motion } from "framer-motion";

interface GaugeCardProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  variant: "debit" | "pression" | "temperature";
  icon: React.ReactNode;
}

const variantStyles = {
  debit: { color: "hsl(185, 72%, 48%)", glowClass: "glow-primary" },
  pression: { color: "hsl(38, 92%, 55%)", glowClass: "glow-accent" },
  temperature: { color: "hsl(0, 72%, 55%)", glowClass: "glow-destructive" },
};

const GaugeCard = ({ label, value, unit, min, max, variant, icon }: GaugeCardProps) => {
  const { color, glowClass } = variantStyles[variant];
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const angle = (percentage / 100) * 240 - 120; // -120 to 120 degrees

  const radius = 70;
  const cx = 90;
  const cy = 90;
  const startAngle = -210;
  const endAngle = startAngle + 240;
  const valueAngle = startAngle + (percentage / 100) * 240;

  const polarToCartesian = (a: number) => ({
    x: cx + radius * Math.cos((a * Math.PI) / 180),
    y: cy + radius * Math.sin((a * Math.PI) / 180),
  });

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-lg border border-border bg-card p-6 ${glowClass}`}
    >
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium uppercase tracking-wider">{label}</span>
      </div>

      <div className="flex items-center justify-center">
        <svg width="180" height="130" viewBox="0 0 180 130">
          {/* Track */}
          <path
            d={describeArc(startAngle, endAngle)}
            fill="none"
            stroke="hsl(210, 15%, 18%)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <motion.path
            d={describeArc(startAngle, valueAngle)}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          {/* Needle dot */}
          {(() => {
            const pos = polarToCartesian(valueAngle);
            return <circle cx={pos.x} cy={pos.y} r="5" fill={color} />;
          })()}
        </svg>
      </div>

      <div className="text-center -mt-2">
        <span className="font-mono text-3xl font-bold" style={{ color }}>
          {value.toFixed(variant === "pression" ? 2 : 1)}
        </span>
        <span className="ml-1 text-sm text-muted-foreground">{unit}</span>
      </div>

      <div className="mt-2 flex justify-between text-xs text-muted-foreground font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </motion.div>
  );
};

export default GaugeCard;
