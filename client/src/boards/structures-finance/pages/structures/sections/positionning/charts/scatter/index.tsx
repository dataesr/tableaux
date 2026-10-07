import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createPositioningScatterOptions, type ScatterConfig } from "./options";
import { RenderData } from "./render-data";
import MetricDefinitionsTable from "../../../../../../components/metric-definitions/metric-definitions-table";

const SCATTER_CONFIGS: Record<string, ScatterConfig> = {
  "scatter-1": {
    title: "Produits de fonctionnement encaissables vs Effectifs d'étudiants",
    xMetric: "produits_de_fonctionnement_encaissables",
    yMetric: "effectif_sans_cpge",
    xLabel: "Produits de fonctionnement encaissables (€)",
    yLabel: "Effectif étudiants (sans CPGE)",
  },
  "scatter-2": {
    title: "SCSP par étudiant vs Taux d'encadrement",
    xMetric: "scsp_par_etudiants",
    yMetric: "taux_encadrement",
    xLabel: "SCSP par étudiant (€)",
    yLabel: "Taux d'encadrement (ETPT/étudiant)",
  },
  "scatter-3": {
    title: "SCSP vs Ressources propres",
    xMetric: "scsp",
    yMetric: "ressources_propres",
    xLabel: "SCSP (€)",
    yLabel: "Ressources propres (€)",
  },
};

interface ScatterChartProps {
  chartType?: "scatter-1" | "scatter-2" | "scatter-3";
  data?: any[];
  currentStructureId?: string;
  currentStructureName?: string;
  selectedYear?: string | number;
}

export default function ScatterChart({
  chartType = "scatter-1",
  data = [],
  currentStructureId,
  currentStructureName = "",
  selectedYear,
}: ScatterChartProps) {
  const baseConfig = SCATTER_CONFIGS[chartType];

  if (!baseConfig) return null;

  const config = {
    ...baseConfig,
    title: `${baseConfig.title}${selectedYear ? ` — ${selectedYear}` : ""}`,
  };

  const metricKeys = [config.xMetric, config.yMetric];

  const chartOptions = useMemo(() => {
    return createPositioningScatterOptions(
      config,
      data,
      currentStructureId,
      currentStructureName
    );
  }, [config, data, currentStructureId, currentStructureName]);

  const chartKey = (() => {
    if (!data || !Array.isArray(data))
      return `${config.xMetric}-${config.yMetric}`;
    const dataIds = data
      .map((d) => d?.etablissement_id_paysage_actuel)
      .sort()
      .join(",");
    return `${config.xMetric}-${config.yMetric}-${currentStructureId}-${dataIds}`;
  })();

  const currentStructureHasData = (() => {
    if (!data?.length || !currentStructureId) return false;
    const currentStructureData = data.find(
      (item) => item.etablissement_id_paysage_actuel === currentStructureId
    );
    if (!currentStructureData) return false;
    const xValue = currentStructureData[config.xMetric];
    const yValue = currentStructureData[config.yMetric];
    return xValue != null && xValue !== 0 && yValue != null && yValue !== 0;
  })();

  if (!data || data.length === 0 || !currentStructureHasData) {
    return (
      <div className="fr-alert fr-alert--warning" role="alert">
        <p className="fr-alert__title">Aucune donnée disponible</p>
        <p>
          Aucune donnée disponible pour{" "}
          {currentStructureName || "l'établissement"}
          {selectedYear ? ` en ${selectedYear}` : ""}.
        </p>
      </div>
    );
  }

  const chartConfig = {
    id: `positioning-scatter-${config.xMetric}-${config.yMetric}`,
    title: config.title,
  };

  return (
    <>
      <ChartWrapper
        key={chartKey}
        config={chartConfig}
        options={chartOptions}
        renderData={() => (
          <RenderData
            config={config}
            data={data}
            currentStructureId={currentStructureId}
            currentStructureName={currentStructureName}
          />
        )}
      />
      <MetricDefinitionsTable metricKeys={metricKeys} />
    </>
  );
}
