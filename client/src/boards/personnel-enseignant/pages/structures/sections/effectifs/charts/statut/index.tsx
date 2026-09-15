import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createStatusChartOptions } from "./options";

interface StatusChartProps {
  selectedYear: string;
  statusDistribution: any[];
}

export default function StatusChart({ selectedYear, statusDistribution }: StatusChartProps) {
  const options = useMemo(() => {
    if (!statusDistribution?.length) return null;
    return createStatusChartOptions(statusDistribution);
  }, [statusDistribution]);

  if (!options) return null;

  return (
    <ChartWrapper
      config={{
        id: "faculty-status-distribution",
        title: { fr: `Effectifs par statut (${selectedYear})`, look: "h5" as const },
        sources: [{ label: { fr: <>MESRE-DGRH, traitement DND</> }, url: { fr: "https://data.enseignementsup-recherche.gouv.fr" } }],
      }}
      options={options}
    />
  );
}
