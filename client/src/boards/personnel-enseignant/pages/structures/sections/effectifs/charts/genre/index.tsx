import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createGenderChartOptions } from "./options";

interface GenderChartProps {
  selectedYear: string;
  genderDistribution: any[];
  totalCount: number;
}

export default function GenderChart({
  selectedYear,
  genderDistribution,
  totalCount,
}: GenderChartProps) {
  const { options } = useMemo(() => {
    if (!genderDistribution?.length) return { options: null };

    const male = genderDistribution.find((g: any) => g._id === "Masculin")?.count || 0;
    const female = genderDistribution.find((g: any) => g._id === "Féminin")?.count || 0;

    return {
      options: createGenderChartOptions(male, female),
    };
  }, [genderDistribution, totalCount]);

  if (!options) return null;

  return (
    <ChartWrapper
      config={{
        id: "faculty-gender-distribution",
        title: {
          fr: `Répartition par genre (${selectedYear})`,
          look: "h5" as const,
        },
        sources: [
          {
            label: { fr: <>MESRE-DGRH, traitement DND</> },
            url: { fr: "https://data.enseignementsup-recherche.gouv.fr" },
          },
        ],
      }}
      options={options}
    />
  );
}
