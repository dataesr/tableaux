import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useFinanceEtablissementEvolution } from "../../../../../../api";
import { createStackedEvolutionChartOptions } from "./options";
import { RenderDataStacked } from "./render-data";
import { getCssColor } from "../../../../../../../../utils/colors";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../../../components/charts-skeletons/default";

type ViewType = "cycles" | "degres" | "disciplines" | "diplomes";

const VIEWS_CONFIG: Record<
  ViewType,
  {
    label: string;
    metrics: string[];
    categories: Record<string, { label: string; color: string }>;
  }
> = {
  cycles: {
    label: "Par cycle (L/M/D)",
    metrics: [
      "effectif_sans_cpge_l",
      "effectif_sans_cpge_m",
      "effectif_sans_cpge_d",
    ],
    categories: {
      effectif_sans_cpge_l: {
        label: "Licence",
        color: getCssColor("scale-1"),
      },
      effectif_sans_cpge_m: { label: "Master", color: getCssColor("scale-2") },
      effectif_sans_cpge_d: {
        label: "Doctorat",
        color: getCssColor("scale-3"),
      },
    },
  },
  degres: {
    label: "Par degré",
    metrics: [
      "effectif_sans_cpge_deg0",
      "effectif_sans_cpge_deg1",
      "effectif_sans_cpge_deg2",
      "effectif_sans_cpge_deg3",
      "effectif_sans_cpge_deg4",
      "effectif_sans_cpge_deg5",
      "effectif_sans_cpge_deg6",
      "effectif_sans_cpge_deg9",
    ],
    categories: {
      effectif_sans_cpge_deg0: {
        label: "BAC ou inférieur",
        color: getCssColor("scale-1"),
      },
      effectif_sans_cpge_deg1: {
        label: "BAC + 1",
        color: getCssColor("scale-2"),
      },
      effectif_sans_cpge_deg2: {
        label: "BAC + 2",
        color: getCssColor("scale-3"),
      },
      effectif_sans_cpge_deg3: {
        label: "BAC + 3",
        color: getCssColor("scale-4"),
      },
      effectif_sans_cpge_deg4: {
        label: "BAC + 4",
        color: getCssColor("scale-5"),
      },
      effectif_sans_cpge_deg5: {
        label: "BAC + 5",
        color: getCssColor("scale-6"),
      },
      effectif_sans_cpge_deg6: {
        label: "BAC + 6 et +",
        color: getCssColor("scale-7"),
      },
      effectif_sans_cpge_deg9: {
        label: "Indéterminé",
        color: getCssColor("scale-8"),
      },
    },
  },
  disciplines: {
    label: "Par discipline",
    metrics: [
      "effectif_sans_cpge_dsa",
      "effectif_sans_cpge_llsh",
      "effectif_sans_cpge_si",
      "effectif_sans_cpge_sante",
      "effectif_sans_cpge_staps",
      "effectif_sans_cpge_theo",
      "effectif_sans_cpge_veto",
      "effectif_sans_cpge_interd",
    ],
    categories: {
      effectif_sans_cpge_dsa: {
        label: "Droit, Sc. éco., AES",
        color: getCssColor("scale-1"),
      },
      effectif_sans_cpge_llsh: {
        label: "Lettres, Langues, SHS",
        color: getCssColor("scale-2"),
      },
      effectif_sans_cpge_si: {
        label: "Sciences et Ingénierie",
        color: getCssColor("scale-3"),
      },
      effectif_sans_cpge_sante: {
        label: "Santé",
        color: getCssColor("scale-4"),
      },
      effectif_sans_cpge_staps: {
        label: "STAPS",
        color: getCssColor("scale-5"),
      },
      effectif_sans_cpge_theo: {
        label: "Théologie",
        color: getCssColor("scale-6"),
      },
      effectif_sans_cpge_veto: {
        label: "Vétérinaire",
        color: getCssColor("scale-7"),
      },
      effectif_sans_cpge_interd: {
        label: "Pluridisciplinaire",
        color: getCssColor("scale-8"),
      },
    },
  },
  diplomes: {
    label: "Par type de diplôme",
    metrics: ["effectif_sans_cpge_dn", "effectif_sans_cpge_du"],
    categories: {
      effectif_sans_cpge_dn: {
        label: "Diplômes nationaux",
        color: getCssColor("scale-1"),
      },
      effectif_sans_cpge_du: {
        label: "Diplômes d'établissement",
        color: getCssColor("scale-2"),
      },
    },
  },
};

interface EffectifsEvolutionChartProps {
  etablissementId?: string;
  etablissementName?: string;
}

export default function EffectifsEvolutionChart({
  etablissementId: propEtablissementId,
  etablissementName,
}: EffectifsEvolutionChartProps) {
  const [searchParams] = useSearchParams();
  const etablissementId =
    propEtablissementId || searchParams.get("structureId") || "";

  const { data, isLoading } = useFinanceEtablissementEvolution(etablissementId);
  const [selectedView, setSelectedView] = useState<ViewType>("cycles");

  const viewConfig = VIEWS_CONFIG[selectedView];

  const availableViews = useMemo(() => {
    if (!data || data.length === 0) return [];
    return (Object.keys(VIEWS_CONFIG) as ViewType[]).filter((viewKey) => {
      const config = VIEWS_CONFIG[viewKey];
      return config.metrics.some((metric) =>
        data.some((item: any) => item[metric] != null && item[metric] > 0)
      );
    });
  }, [data]);

  const chartOptions = useMemo(() => {
    if (!data || data.length === 0) return null;
    return createStackedEvolutionChartOptions(
      data,
      viewConfig.metrics,
      viewConfig.categories
    );
  }, [data, viewConfig]);

  const years = !data
    ? []
    : [...new Set(data.map((d: any) => d.exercice))]
        .filter((y): y is number => typeof y === "number")
        .sort((a, b) => a - b);

  const periodText =
    years.length === 0
      ? ""
      : years.length === 1
        ? String(years[0])
        : `${years[0]} - ${years[years.length - 1]}`;

  const etabName = etablissementName || data?.[0]?.etablissement_lib || "";

  const config = {
    id: "effectifs-evolution",
    integrationURL: `/integration?chart_id=effectifs-evolution&structureId=${etablissementId}`,
    title: `Évolution des effectifs ${viewConfig.label.toLowerCase()}${etabName ? ` — ${etabName}` : ""}`,
    comment: {
      fr: (
        <>
          Répartition des effectifs étudiants {viewConfig.label.toLowerCase()}{" "}
          sur la période {periodText}.
        </>
      ),
    },
  };

  if (isLoading) {
    return <DefaultSkeleton height="400px" />;
  }

  if (!data || data.length === 0 || availableViews.length === 0) {
    return (
      <div className="fr-alert fr-alert--info fr-mt-2w">
        <p>Aucune donnée d'évolution des effectifs disponible.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="fr-mb-2w">
        <SegmentedControl
          className="fr-segmented--sm fr-segmented--no-legend"
          label="Répartition affichée"
          name="effectifs-evolution-view"
        >
          {availableViews.map((viewKey) => (
            <SegmentedElement
              key={viewKey}
              checked={selectedView === viewKey}
              label={VIEWS_CONFIG[viewKey].label}
              onClick={() => setSelectedView(viewKey)}
              value={viewKey}
            />
          ))}
        </SegmentedControl>
      </div>

      {chartOptions && (
        <ChartWrapper
          config={config}
          options={chartOptions}
          renderData={() => (
            <RenderDataStacked
              data={data}
              metrics={viewConfig.metrics}
              categories={viewConfig.categories}
            />
          )}
        />
      )}
    </div>
  );
}
