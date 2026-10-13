import { useId, useState, type ReactNode } from "react";
import { Title } from "@dataesr/dsfr-plus";

import "./styles.scss";

export interface MetricDefinition {
  key: string;
  title: ReactNode;
  unit?: string;
  definition?: ReactNode;
  calcul?: ReactNode;
  interpretation?: ReactNode;
  source?: ReactNode;
}

interface MetricDefinitionsProps {
  countLabel?: string;
  definitions: MetricDefinition[];
  title?: string;
}

const SECTIONS = [
  { field: "definition", icon: "fr-icon-file-text-line", label: "Définition" },
  { field: "calcul", icon: "fr-icon-line-chart-fill", label: "Calcul" },
  { field: "interpretation", icon: "fr-icon-lightbulb-line", label: "Interprétation" },
] as const;

export default function MetricDefinitions({
  countLabel = "indicateur",
  definitions,
  title = "À propos des indicateurs",
}: MetricDefinitionsProps) {
  const [isOpen, setIsOpen] = useState(definitions.length < 3);
  const panelId = useId();

  if (!definitions.length) return null;

  return (
    <div className="metric-definitions fr-mt-4w">
      <Title as="h2" look="h6" className="fr-mb-0">
        <button
          type="button"
          className="metric-definitions__toggle fr-px-3w fr-py-2w"
          onClick={() => setIsOpen(!isOpen)}
          aria-controls={panelId}
          aria-expanded={isOpen}
        >
          <span className="fr-icon-information-line fr-icon--lg fr-text-label--blue-france" aria-hidden="true" />
          <span className="fr-col fr-text--bold">{title}</span>{" "}
          <span className="fr-background-contrast--grey fr-text-mention--grey fr-text--sm fr-mb-0 fr-px-3v fr-py-1v">
            {definitions.length} {countLabel}{definitions.length > 1 ? "s" : ""}
          </span>
          <span
            className={`fr-icon-arrow-${isOpen ? "up" : "down"}-s-line fr-text-label--blue-france`}
            aria-hidden="true"
          />
        </button>
      </Title>

      <div id={panelId} hidden={!isOpen}>
        <dl className="metric-definitions__grid fr-mt-2w fr-mb-0 fr-p-0">
          {definitions.map((def) => (
            <div key={def.key} className="metric-definitions__card fr-p-2w">
              <dt className="metric-definitions__card-header fr-text--bold fr-pb-3v fr-mb-2w">
                {def.title}
                {def.unit && <span className="fr-badge fr-badge--sm fr-badge--info fr-badge--no-icon">{def.unit}</span>}
              </dt>
              <dd className="fr-m-0 fr-p-0">
                {SECTIONS.map(({ field, icon, label }) => def[field] && (
                  <div key={field} className="metric-definitions__section fr-mb-2w">
                    <span className={`${icon} fr-icon--sm fr-text-label--blue-france`} aria-hidden="true" />
                    <div className="fr-col">
                      <strong className="metric-definitions__label fr-text--xs fr-text-mention--grey fr-mb-1v">{label}</strong>
                      <div className="fr-text--sm fr-mb-0">{def[field]}</div>
                    </div>
                  </div>
                ))}
                {def.source && (
                  <div className="metric-definitions__source fr-pt-3v">
                    <span className="fr-icon-database-line fr-icon--sm fr-text-mention--grey" aria-hidden="true" />
                    <div className="fr-col fr-text--sm fr-mb-0">{def.source}</div>
                  </div>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
