import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useId, useMemo, useState, type CSSProperties } from "react";

import { Container, Row, Col } from "@dataesr/dsfr-plus";

const { VITE_APP_SERVER_URL } = import.meta.env;

import "./styles.scss";

type Props = {
  filter?: string;
};

type Call = {
  action_code: string;
  call_id: string;
  call_year: number | string;
  status: string;
  expectedGrants: number;
  nb_proj_successful: number;
};

function getRatio(call: Call): number {
  if (!call.expectedGrants || call.expectedGrants <= 0) return 0;
  return Math.min(1, Math.max(0, call.nb_proj_successful / call.expectedGrants));
}

// --- Export CSV ---

const CSV_COLUMNS: { key: keyof Call; label: string }[] = [
  { key: "call_id", label: "call_id" },
  { key: "call_year", label: "call_year" },
  { key: "action_code", label: "action_code" },
  { key: "status", label: "status" },
  { key: "expectedGrants", label: "expectedGrants" },
  { key: "nb_proj_successful", label: "nb_proj_successful" },
];

const CSV_SEPARATOR = ";"; // point-virgule : s'ouvre correctement dans Excel FR

function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[;"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function callsToCsv(calls: Call[]): string {
  const header = CSV_COLUMNS.map((c) => c.label).join(CSV_SEPARATOR);
  const rows = calls.map((call) => CSV_COLUMNS.map((c) => escapeCsvValue(call[c.key])).join(CSV_SEPARATOR));
  return [header, ...rows].join("\r\n");
}

function downloadCsv(filename: string, content: string) {
  // BOM UTF-8 pour qu'Excel interprète correctement les accents
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --- Composants ---

function CallItem({ call }: { call: Call }) {
  const ratio = getRatio(call);
  const percent = Math.round(ratio * 100);
  const isIncomplete = call.status === "incomplete";
  const tooltipId = `tooltip-${useId().replace(/:/g, "")}`;

  return (
    <li>
      <button type="button" className={`item ${call.status}`} style={isIncomplete ? ({ "--ratio": `${percent}%` } as CSSProperties) : undefined} aria-describedby={tooltipId} aria-label={call.call_id} />
      <span className="fr-tooltip fr-placement" id={tooltipId} role="tooltip" aria-hidden="true">
        <strong>{call.call_id}</strong>
        <br />
        Action : {call.action_code}
        <br />
        Année : {call.call_year}
        <br />
        Statut : {call.status}
        <br />
        Projets : {call.nb_proj_successful} / {call.expectedGrants}
        {call.expectedGrants > 0 && ` (${percent} %)`}
      </span>
    </li>
  );
}

type YearSectionProps = {
  calls: Call[];
  year: string;
};

function YearSection({ calls, year }: YearSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="fr-accordion">
      <div className="year-header">
        <h3 className="fr-accordion__title">
          <button type="button" className="fr-accordion__btn" aria-expanded={expanded} aria-controls={`accordion-${year}`} onClick={() => setExpanded((e) => !e)}>
            {year}
          </button>
        </h3>
        <button type="button" className="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-download-line" title={`Télécharger les calls ${year} au format CSV`} onClick={() => downloadCsv(`calls-${year}.csv`, callsToCsv(calls))}>
          CSV
        </button>
      </div>
      <div id={`accordion-${year}`} className={`fr-collapse ${expanded ? "fr-collapse--expanded" : ""}`}>
        <ul className="year">
          {calls.map((call) => (
            <CallItem key={`${call.call_id}-${call.action_code}`} call={call} />
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Calls({ filter }: Props) {
  const [searchParams] = useSearchParams();
  const rangeOfYears = searchParams.get("range_of_years");

  // le select n'est affiché que si aucun filtre n'est imposé par les props
  const hasFixedFilter = filter !== undefined && filter !== "";
  const [selectedFilter, setSelectedFilter] = useState("all");
  const activeFilter = hasFixedFilter ? filter : selectedFilter;

  const { data, isLoading } = useQuery<Call[]>({
    queryKey: ["european-projects/calls"],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/european-projects/calls`).then((response) => response.json()),
  });

  // dédoublonnage sur call_id + action_code
  const uniqueData = useMemo(() => {
    const seen = new Set<string>();
    return (data ?? []).filter((call) => {
      const key = `${call.call_id}|${call.action_code}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data]);

  const filteredData = useMemo(() => uniqueData.filter((call) => activeFilter === "all" || call.action_code === activeFilter), [uniqueData, activeFilter]);

  const actionCodes = useMemo(() => Array.from(new Set(uniqueData.map((call) => call.action_code))), [uniqueData]);

  const years = useMemo(() => {
    const available = Array.from(new Set(filteredData.map((call) => String(call.call_year)))).sort();
    if (!rangeOfYears) return available;
    const wanted = rangeOfYears.split("|");
    return available.filter((y) => wanted.includes(y));
  }, [filteredData, rangeOfYears]);

  if (isLoading || !data) {
    return <>loading ...</>;
  }

  return (
    <Container className="ep-calls">
      {!hasFixedFilter && (
        <Row>
          <Col>
            <label className="fr-label" htmlFor="action-code-select">
              action code
            </label>
            <select id="action-code-select" className="fr-select" value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
              <option value="all">Tous</option>
              {actionCodes.map((ac) => (
                <option key={ac} value={ac}>
                  {ac}
                </option>
              ))}
            </select>
          </Col>
        </Row>
      )}
      <Row>
        <Col>
          <ul title="légende" className="legend">
            <li>
              <div className="item unavailable fr-mr-1w" />
              unavailable
            </li>
            <li>
              <div className="item incomplete fr-mr-1w" style={{ "--ratio": "50%" } as CSSProperties} />
              incomplete
            </li>
            <li>
              <div className="item complete fr-mr-1w" />
              complete
            </li>
          </ul>
        </Col>
      </Row>
      {years.map((year) => (
        <YearSection key={`${activeFilter}-${year}`} year={year} calls={filteredData.filter((call) => String(call.call_year) === year)} />
      ))}
    </Container>
  );
}
