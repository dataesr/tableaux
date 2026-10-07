import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { useFinanceEtablissementEvolution } from "../../../../../../api";
import { createEffectifsSpecifiquesChartOptions } from "./options";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";

interface EffectifsSpecifiquesChartProps {
  data?: any;
  selectedYear?: string | number;
  etablissementName?: string;
}

export default function EffectifsSpecifiquesChart({
  data: propData,
  selectedYear: propSelectedYear,
  etablissementName,
}: EffectifsSpecifiquesChartProps) {
  const [searchParams] = useSearchParams();
  const etablissementId = searchParams.get("structureId") || "";
  const selectedYear = propSelectedYear || searchParams.get("year") || "";

  const { data: evolutionData } = useFinanceEtablissementEvolution(
    etablissementId,
    !!etablissementId
  );

  const data = useMemo(() => {
    if (propData) return propData;
    if (!evolutionData || !selectedYear) return null;
    return evolutionData.find(
      (item: any) => String(item.exercice) === String(selectedYear)
    );
  }, [propData, evolutionData, selectedYear]);

  const options = useMemo(() => {
    if (!data) return {} as Highcharts.Options;
    return createEffectifsSpecifiquesChartOptions(data);
  }, [data]);

  const etabName = etablissementName || data?.etablissement_lib || "";

  const config = {
    id: "effectifs-specifiques",
    integrationURL: `/integration?chart_id=effectifs-specifiques&structureId=${etablissementId}&year=${selectedYear}`,
    title: `Effectifs - Filières spécifiques${etabName ? ` — ${etabName}` : ""}${selectedYear ? ` — ${selectedYear}` : ""}`,
  };

  if (!data) return null;

  return (
    <ChartWrapper
      config={config}
      options={options}
    />
  );
}
