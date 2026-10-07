import { useMemo, useState } from "react";
import "./metric-definitions-table.scss";
import { Title } from "@dataesr/dsfr-plus";
import { useFinanceDefinitions } from "../../api";
import DefaultSkeleton from "../../../../components/charts-skeletons/default";
import { parseMarkdown } from "../../../../utils/format";

interface MetricDefinitionsTableProps {
  metricKeys: string[];
}

export default function MetricDefinitionsTable({
  metricKeys,
}: MetricDefinitionsTableProps) {
  const [isOpen, setIsOpen] = useState(metricKeys.length < 3);
  const { data: definitions, isLoading } = useFinanceDefinitions();

  const relevantDefinitions = useMemo(() => {
    if (!definitions || !metricKeys) return [];
    const allDefs = definitions.flatMap((cat) =>
      cat.sousRubriques.flatMap((sr) => sr.definitions)
    );

    const findDef = (indicator: string) =>
      allDefs.find(
        (d) => d.indicateur === indicator && d.PageDefinition !== false
      );

    const added = new Set<string>();
    const result: any[] = [];
    const hasIpcKey = metricKeys.some((key) => key.endsWith("_ipc"));

    metricKeys.forEach((key) => {
      if (key.endsWith("_ipc")) return;
      const baseKey = key.replace(/_ipc$/, "").replace(/^part_/, "");
      const def = findDef(baseKey);
      if (def && !added.has(baseKey)) {
        result.push(def);
        added.add(baseKey);
      }
    });

    if (hasIpcKey) {
      const ipcDef = findDef("ipc");
      if (ipcDef && !added.has("ipc")) {
        result.push(ipcDef);
      }
    }

    return result;
  }, [definitions, metricKeys]);

  if (isLoading) {
    return (
      <div className="fr-mt-4w">
        <DefaultSkeleton height="120px" />
      </div>
    );
  }

  if (relevantDefinitions.length === 0) {
    return null;
  }

  const renderSourceLinks = (def: (typeof relevantDefinitions)[0]) => {
    const sources: Array<{ label: string; link: string | null }> = [
      { label: def.source1fr || "", link: def.opendata1 || null },
      { label: def.source2fr || "", link: def.opendata2 || null },
      { label: def.source3fr || "", link: def.opendata3 || null },
      { label: def.source4fr || "", link: def.opendata4 || null },
    ].filter((source) => source.label);

    if (sources.length === 0) return null;

    return (
      <div className="definition-footer">
        <span className="fr-icon-database-line" aria-hidden="true" />
        <div className="source-content fr-text--sm">
          {sources.map((source, index) => (
            <div key={index} className={index > 0 ? "fr-mt-1v" : ""}>
              <span className="source-text">{source.label}</span>
              {source.link && (
                <>
                  {" "}
                  <a
                    href={source.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link--sm"
                    title={`(données ouvertes) : ${source.label} - nouvelle fenêtre`}
                  >
                    (données ouvertes)
                  </a>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="metric-definitions-table fr-mt-4w">
      <Title as="h2" look="h6" className="fr-mb-0">
        <button
          type="button"
          className="definitions-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <span className="definitions-toggle-content">
            <span
              className="fr-icon-information-line fr-icon--lg"
              aria-hidden="true"
            />
            <span className="definitions-toggle-label">
              À propos des indicateurs
            </span>
            <span className="definitions-count">
              {relevantDefinitions.length} indicateur
              {relevantDefinitions.length > 1 ? "s" : ""}
            </span>
          </span>
          <span
            className={`fr-icon-arrow-down-s-line toggle-icon ${isOpen ? "open" : ""}`}
            aria-hidden="true"
          />
        </button>
      </Title>

      {isOpen && (
        <div className="definitions-grid">
          {relevantDefinitions.map((def, index) => (
            <div key={`${def.indicateur}-${index}`} className="definition-card">
              <div className="definition-card-header">
                <Title as="h3" look="h6" className="definition-title">
                  {def.libelle}
                </Title>
                {def.unite && def.unite !== "-" && (
                  <span className="definition-unit">{def.unite}</span>
                )}
              </div>

              {def.definition && def.definition !== "-" && (
                <div className="definition-section">
                  <span
                    className="section-icon fr-icon-file-text-line"
                    aria-hidden="true"
                  />
                  <div className="section-content">
                    <strong className="section-label">Définition</strong>
                    <p
                      className="fr-mb-2w fr-text--sm"
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(def.definition),
                      }}
                    />
                  </div>
                </div>
              )}
              {def.calculfr && def.calculfr !== "-" && (
                <div className="definition-section">
                  <span
                    className="section-icon fr-icon-line-chart-fill"
                    aria-hidden="true"
                  />
                  <div className="section-content">
                    <strong className="section-label">Calcul</strong>
                    <p
                      className="fr-mb-2w fr-text--sm"
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(def.calculfr),
                      }}
                    />
                  </div>
                </div>
              )}

              {def.interpretation && def.interpretation !== "-" && (
                <div className="definition-section">
                  <span
                    className="section-icon fr-icon-lightbulb-line"
                    aria-hidden="true"
                  />
                  <div className="section-content">
                    <strong className="section-label">Interprétation</strong>
                    <p className="section-text">{def.interpretation}</p>
                  </div>
                </div>
              )}

              {renderSourceLinks(def)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
