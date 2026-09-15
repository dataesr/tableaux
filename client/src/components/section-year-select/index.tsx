import { createContext, ReactNode, useContext } from "react";
import "./styles.scss";

interface SectionYearContextValue {
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  label: string;
}

const SectionYearContext = createContext<SectionYearContextValue | null>(null);

export function SectionYearProvider({
  children,
  ...value
}: SectionYearContextValue & { children: ReactNode }) {
  return (
    <SectionYearContext.Provider value={value}>
      {children}
    </SectionYearContext.Provider>
  );
}

export default function SectionYearSelect() {
  const context = useContext(SectionYearContext);
  if (!context) return null;

  const { years, selectedYear, onYearChange, label } = context;

  return (
    <div className="section-year-select fr-select-group fr-mb-0">
      <label className="fr-label" htmlFor="section-year-select">
        {label}
      </label>
      <select
        className="fr-select"
        id="section-year-select"
        name="year"
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
