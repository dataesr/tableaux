import { useMemo } from "react";
import "./styles.scss";

export type GaugeValue = {
  label: string;
  value: number;
  color: string;
};

export type GaugeProps = {
  values: Record<string, GaugeValue>;
};

export default function Gauge({ values }: GaugeProps) {
  const entries = useMemo(() => Object.values(values), [values]);
  
  const total = useMemo(() => {
    return entries.reduce((sum, item) => sum + item.value, 0);
  }, [entries]);

  const percentages = useMemo(() => {
    if (total === 0) return entries.map(() => 0);
    return entries.map((item) => (item.value / total) * 100);
  }, [entries, total]);

  return (
    <div className="gauge">
      <div className="gauge-bar">
        {entries.map((entry, index) => (
          <div
            key={`${entry.label}-${index}`}
            className="gauge-segment"
            style={{
              width: `${percentages[index]}%`,
              backgroundColor: entry.color,
            }}
            title={`${entry.label}: ${entry.value} (${percentages[index].toFixed(1)}%)`}
          />
        ))}
      </div>
      <div className="gauge-legend">
        {entries.map((entry, index) => (
          <div key={`legend-${entry.label}-${index}`} className="gauge-legend-item">
            <span
              className="gauge-legend-color"
              style={{ backgroundColor: entry.color }}
            />
            <span className="gauge-legend-label">{entry.label}</span>
            <span className="gauge-legend-value">
              {entry.value.toLocaleString()} ({percentages[index].toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
