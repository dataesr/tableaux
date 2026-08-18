import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createAgeChartOptions, AGE_ORDER } from "./options";

interface AgeChartProps {
  selectedYear: string;
  ageDistribution: any[];
}

export default function AgeChart({
  selectedYear,
  ageDistribution,
}: AgeChartProps) {
  const { options, peakClass } = useMemo(() => {
    if (!ageDistribution?.length) return { options: null, peakClass: null };

    const sorted = [...ageDistribution].sort(
      (a, b) => AGE_ORDER.indexOf(a._id || "") - AGE_ORDER.indexOf(b._id || "")
    );

    const categories = sorted.map((a: any) => a._id || "Non précisé");
    const maleData = sorted.map((a: any) =>
      a.gender_breakdown?.find((g: any) => g.gender === "Masculin")?.count || 0
    );
    const femaleData = sorted.map((a: any) =>
      a.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0
    );

    const peak = sorted.reduce(
      (max, c) => ((c.total || 0) > (max.total || 0) ? c : max),
      sorted[0]
    );

    return {
      peakClass: peak && (peak.total || 0) > 0 ? { name: peak._id, total: peak.total } : null,
      options: createAgeChartOptions(categories, maleData, femaleData),
    };
  }, [ageDistribution]);

  if (!options) return null;

  return (
    <ChartWrapper
      config={{
        id: "faculty-age-distribution",
        title: {
          fr: `Répartition par classe d'âge (${selectedYear})`,
          look: "h5" as const,
        },
        readingKey: peakClass
          ? {
              fr: (
                <>
                  La tranche d'âge la plus représentée est «{" "}
                  <strong>{peakClass.name}</strong> » avec{" "}
                  <strong>{peakClass.total.toLocaleString("fr-FR")}</strong> personnes.
                </>
              ),
            }
          : undefined,
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
