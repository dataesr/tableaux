import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { useFinanceEtablissementEvolution } from "../../../../../../api";
import { createEffectifsDisciplinesChartOptions } from "./options";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";

interface EffectifsDisciplinesChartProps {
  data?: any;
  selectedYear?: string | number;
  etablissementName?: string;
}

export default function EffectifsDisciplinesChart({
  data: propData,
  selectedYear: propSelectedYear,
  etablissementName,
}: EffectifsDisciplinesChartProps) {
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
    return createEffectifsDisciplinesChartOptions(data);
  }, [data]);

  const etabName = etablissementName || data?.etablissement_lib || "";

  const config = {
    id: "effectifs-disciplines",
    integrationURL: `/integration?chart_id=effectifs-disciplines&structureId=${etablissementId}&year=${selectedYear}`,
    title: `Effectifs par disciplines${etabName ? ` — ${etabName}` : ""}${selectedYear ? ` — ${selectedYear}` : ""}`,
  };

  if (!data) return null;

  return (
    <ChartWrapper
      config={config}
      options={options}
    />
  );
}
