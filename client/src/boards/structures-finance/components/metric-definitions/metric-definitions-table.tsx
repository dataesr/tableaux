import { useMemo } from "react";
import { useFinanceDefinitions } from "../../api";
import DefaultSkeleton from "../../../../components/charts-skeletons/default";
import MetricDefinitions from "../../../../components/metric-definitions";
import { parseMarkdown } from "../../../../utils/format";

const hasContent = (text?: string) => !!text && text !== "-";

const renderMarkdown = (text: string) => (
  <span dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }} />
);

interface MetricDefinitionsTableProps {
  metricKeys: string[];
}

export default function MetricDefinitionsTable({
  metricKeys,
}: MetricDefinitionsTableProps) {
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
      <>
        {sources.map((source, index) => (
          <div key={index} className={index > 0 ? "fr-mt-1v" : ""}>
            <span className="fr-text-mention--grey">{source.label}</span>
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
      </>
    );
  };

  return (
    <MetricDefinitions
      definitions={relevantDefinitions.map((def, index) => ({
        key: `${def.indicateur}-${index}`,
        title: def.libelle,
        unit: hasContent(def.unite) ? def.unite : undefined,
        definition: hasContent(def.definition) ? renderMarkdown(def.definition) : undefined,
        calcul: hasContent(def.calculfr) ? renderMarkdown(def.calculfr) : undefined,
        interpretation: hasContent(def.interpretation) ? def.interpretation : undefined,
        source: renderSourceLinks(def),
      }))}
    />
  );
}
