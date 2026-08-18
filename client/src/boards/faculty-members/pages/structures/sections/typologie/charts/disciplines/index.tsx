import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createDisciplineChartOptions } from "./options";

interface DisciplineChartProps {
  selectedYear: string;
  disciplineDistribution: any[];
}

export default function DisciplineChart({
  selectedYear,
  disciplineDistribution,
}: DisciplineChartProps) {
  const { options, largest } = useMemo(() => {
    if (!disciplineDistribution?.length) return { options: null, largest: null };

    const sorted = [...disciplineDistribution].sort(
      (a: any, b: any) => (b.total || 0) - (a.total || 0)
    );

    const categories = sorted.map(
      (d: any) => d._id?.name || d._id?.discipline_name || "Non précisé"
    );
    const maleData = sorted.map((d: any) =>
      d.gender_breakdown?.find((g: any) => g.gender === "Masculin")?.count || 0
    );
    const femaleData = sorted.map((d: any) =>
      d.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0
    );

    const top = sorted[0];
    const topName = top?._id?.name || top?._id?.discipline_name || "";

    return {
      largest: (top?.total || 0) > 0 ? { name: topName, total: top.total } : null,
      options: createDisciplineChartOptions(categories, maleData, femaleData),
    };
  }, [disciplineDistribution]);

  if (!options) return null;

  return (
    <ChartWrapper
      config={{
        id: "faculty-discipline-distribution",
        title: {
          fr: `Répartition par grande discipline (${selectedYear})`,
          look: "h5" as const,
        },
        readingKey: largest
          ? {
              fr: (
                <>
                  La discipline la plus représentée est «{" "}
                  <strong>{largest.name}</strong> » avec{" "}
                  <strong>{largest.total.toLocaleString("fr-FR")}</strong> enseignants.
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
