import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement, Title } from "@dataesr/dsfr-plus";

import { getData, type EvolutionMetric } from "./query";
import { getI18nLabel } from "../../../../../../utils";
import { useGetParams, formatRatio } from "./utils";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import Options, { processEvolutionData } from "./options";

import i18n from "../../i18n.json";

interface EvolutionChartsProps {
  countryAdjective?: string;
  currentLang?: string;
}

const metricLabels = {
  funding: { fr: "Financements", en: "Funding" },
  pi: { fr: "Porteurs de projets", en: "Project PIs" },
  projects: { fr: "Projets", en: "Projects" },
};

const configWeight = {
  id: "ercEvolutionWeight",
  idQuery: "ercEvolution",
  title: {
    en: "Share of successful projects",
    fr: "Poids des projets lauréats",
    className: "fr-my-1w fr-ml-1w",
  },
  integrationURL: "/european-projects/components/pages/erc/charts/evolution-weight",
};

const configSuccessRate = {
  id: "ercEvolutionSuccessRate",
  idQuery: "ercEvolution",
  title: {
    en: "Success rate",
    fr: "Taux de succès",
    className: "fr-my-1w fr-ml-1w",
  },
  integrationURL: "/european-projects/components/pages/erc/charts/evolution-success-rate",
};

export default function EvolutionGlobalCharts({ countryAdjective = "français", currentLang: propLang }: EvolutionChartsProps) {
  const { params, currentLang: urlLang } = useGetParams();
  const currentLang = propLang || urlLang;
  const [searchParams, setSearchParams] = useSearchParams();
  const metricParam = searchParams.get("erc_evolution_metric");
  const metric: EvolutionMetric = metricParam === "funding" || metricParam === "projects" ? metricParam : "pi";

  const { data, isLoading } = useQuery({
    queryKey: ["ercEvolution", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });
  const processedData = useMemo(() => (data ? processEvolutionData(data, currentLang, metric) : null), [data, currentLang, metric]);

  if (isLoading || !processedData) return <DefaultSkeleton />;

  const selectedMetric = metric;
  const getConfig = (type: "weight" | "successRate") => {
    const series = type === "weight" ? processedData.weightSeries : processedData.successRateSeries;
    const example = series.flatMap((item) => item.data.map((point, index) => ({ point, year: processedData.years[index], name: item.name }))).find((item) => item.point);
    const label = metricLabels[selectedMetric];
    return {
      ...(type === "weight" ? configWeight : configSuccessRate),
      title: {
        ...(type === "weight" ? configWeight.title : configSuccessRate.title),
        fr: `${type === "weight" ? "Poids" : "Taux de succès"} : ${label.fr.toLowerCase()}`,
        en: `${type === "weight" ? "Share" : "Success rate"}: ${label.en.toLowerCase()}`,
      },
      comment:
        type === "weight"
          ? {
              fr: <>Part des {label.fr.toLowerCase()} associés aux projets lauréats du pays sélectionné dans le total européen, par type de financement ERC.</>,
              en: <>Share of {label.en.toLowerCase()} associated with successful projects in the selected country compared with the European total, by ERC funding type.</>,
            }
          : {
              fr: <>Rapport entre les {label.fr.toLowerCase()} associés aux projets lauréats et aux projets évalués du pays sélectionné, par type de financement ERC.</>,
              en: <>Ratio of {label.en.toLowerCase()} associated with successful projects to those associated with evaluated projects in the selected country, by ERC funding type.</>,
            },
      ...(example?.point
        ? {
            readingKey: {
              fr: (
                <>
                  En {example.year}, pour {example.name} : {formatRatio(example.point, selectedMetric, "fr")}.
                </>
              ),
              en: (
                <>
                  In {example.year}, for {example.name}: {formatRatio(example.point, selectedMetric, "en")}.
                </>
              ),
            },
          }
        : {}),
    };
  };

  if (processedData.years.length === 0) {
    return (
      <div className="fr-alert fr-alert--info">
        <p>{getI18nLabel(i18n, "evolution.noDataAvailable", currentLang)}</p>
      </div>
    );
  }

  return (
    <div className="evolution-charts">
      <Title as="h3">
        {getI18nLabel(i18n, "evolution.sectionTitle", currentLang)} {countryAdjective}
      </Title>

      <SegmentedControl
        className="fr-segmented--sm fr-mb-2w"
        name="metrics"
        label={currentLang === "en" ? "Indicator" : "Choix de l'indicateur"}
        onChangeValue={(value) => {
          const nextUrl = new URLSearchParams(searchParams);
          if (value === "pi") nextUrl.delete("erc_evolution_metric");
          else nextUrl.set("erc_evolution_metric", value);
          setSearchParams(nextUrl, { replace: true });
        }}
      >
        <SegmentedElement checked={metric === "pi"} label={metricLabels["pi"][currentLang === "en" ? "en" : "fr"]} value={"pi"} />
        <SegmentedElement checked={metric === "funding"} label={metricLabels["funding"][currentLang === "en" ? "en" : "fr"]} value={"funding"} />
        <SegmentedElement checked={metric === "projects"} label={metricLabels["projects"][currentLang === "en" ? "en" : "fr"]} value={"projects"} />
      </SegmentedControl>

      <div className="fr-mb-1w chart-container chart-container--default">
        <ChartWrapper
          config={getConfig("weight")}
          options={Options({
            processedData,
            chartType: "weight",
            metric: selectedMetric,
            currentLang,
          })}
        />
      </div>

      <div className="fr-mb-4w chart-container chart-container--default">
        <ChartWrapper
          config={getConfig("successRate")}
          options={Options({
            processedData,
            chartType: "successRate",
            metric: selectedMetric,
            currentLang,
          })}
        />
      </div>
    </div>
  );
}
