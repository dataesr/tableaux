import { Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import DefaultSkeleton from "../../../../components/charts-skeletons/default.tsx";
import { useChartColor } from "../../../../hooks/useChartColor.tsx";
import { getI18nLabel } from "../../../../utils.tsx";
import ChartWrapperFundings from "../../components/chart-wrapper-fundings/index.tsx";
import SegmentedControl from "../../components/segmented-control/index.tsx";
import i18n from "../../i18n.json";
import { formatCompactNumber, getCssColor, getEsQuery, pattern, years } from "../../utils.ts";

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env;

export default function InstrumentsOverTimeForEurope({ name }: { name: string | undefined }) {
  const [selectedControl, setSelectedControl] = useState("projects")
  const [searchParams] = useSearchParams()
  const region = searchParams.get("region")
  const structure = searchParams.get("structureId")
  const color = useChartColor()

  const body = {
    ...getEsQuery({ regions: [region], structures: [structure] }),
    aggregations: {
      by_instrument: {
        terms: {
          field: "project_instrument.keyword",
        },
        aggregations: {
          by_project_year: {
            terms: {
              field: "project_year",
              size: 25,
            },
            aggregations: {
              is_coordinator: {
                terms: {
                  field: "participation_is_coordinator",
                },
                aggregations: {
                  by_unique_project: {
                    cardinality: {
                      field: "project_id.keyword",
                    },
                  },
                  should_ignore_budget: {
                    terms: {
                      field: structure ? "participant_ignore_total_budget" : "region_ignore_total_budget",
                      missing: 0,
                    },
                    aggregations: {
                      sum_budget: {
                        sum: {
                          field: "project_budgetFinanced",
                        },
                      },
                    },
                  },
                  should_ignore_funding: {
                    terms: {
                      field: structure ? "participant_ignore_funding" : "region_ignore_funding",
                      missing: 0,
                    },
                    aggregations: {
                      sum_funding: {
                        sum: {
                          field: "participation_funding",
                        },
                      },
                    },
                  },
                },
              },
              by_unique_project: {
                cardinality: {
                  field: "project_id.keyword",
                },
              },
              should_ignore_budget: {
                terms: {
                  field: structure ? "participant_ignore_total_budget" : "region_ignore_total_budget",
                  missing: 0,
                },
                aggregations: {
                  sum_budget: {
                    sum: {
                      field: "project_budgetFinanced",
                    },
                  },
                },
              },
              should_ignore_funding: {
                terms: {
                  field: structure ? "participant_ignore_funding" : "region_ignore_funding",
                  missing: 0,
                },
                aggregations: {
                  sum_funding: {
                    sum: {
                      field: "participation_funding",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  body.query.bool.filter.push({ terms: { "project_type.keyword": ["Horizon 2020", "Horizon Europe"] } });

  const { data, isLoading } = useQuery({
    queryKey: ["funding-instruments-over-time-for-europe", region, structure],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`, {
        body: JSON.stringify(body),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        method: "POST",
      }).then((response) => response.json()),
  });

  const seriesBudget: any = [];
  const seriesFunding: any = [];
  const seriesProject: any = [];
  const seriesBudgetRegion: any = [];
  const seriesFundingRegion: any = [];
  const seriesProjectRegion: any = [];
  (data?.aggregations?.by_instrument?.buckets ?? []).forEach((instrument) => {
    seriesBudget.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: instrument.key, prefix: "instrument" }) } },
      data: years.map((year) => instrument?.by_project_year?.buckets
        ?.find((bucket) => bucket.key === year)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 1)?.should_ignore_budget?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0),
      marker: { enabled: false },
      name: [instrument.key, getI18nLabel(i18n, 'coordinator')].join(' - '),
    });
    seriesBudget.push({
      color: getCssColor({ name: instrument.key, prefix: "instrument" }),
      data: years.map((year) => instrument?.by_project_year?.buckets
        ?.find((bucket) => bucket.key === year)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 0)?.should_ignore_budget?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0),
      marker: { enabled: false },
      name: [instrument.key, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    });
    seriesBudgetRegion.push({
      color: getCssColor({ name: instrument.key, prefix: "instrument" }),
      data: years.map((year) => instrument
        ?.by_project_year?.buckets?.find((bucket) => bucket.key === year)
        ?.should_ignore_budget?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0),
      marker: { enabled: false },
      name: instrument.key,
    });
    seriesFunding.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: instrument.key, prefix: "instrument" }) } },
      data: years.map((year) => instrument?.by_project_year?.buckets
        ?.find((bucket) => bucket.key === year)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 1)?.should_ignore_funding?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0),
      marker: { enabled: false },
      name: [instrument.key, getI18nLabel(i18n, 'coordinator')].join(' - '),
    });
    seriesFunding.push({
      color: getCssColor({ name: instrument.key, prefix: "instrument" }),
      data: years.map((year) => instrument?.by_project_year?.buckets
        ?.find((bucket) => bucket.key === year)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 0)?.should_ignore_funding?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0),
      marker: { enabled: false },
      name: [instrument.key, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    });
    seriesFundingRegion.push({
      color: getCssColor({ name: instrument.key, prefix: "instrument" }),
      data: years.map((year) => instrument
        ?.by_project_year?.buckets?.find((bucket) => bucket.key === year)
        ?.should_ignore_funding?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0),
      marker: { enabled: false },
      name: instrument.key,
    });
    seriesProject.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: instrument.key, prefix: "instrument" }) } },
      data: years.map((year) => instrument?.by_project_year?.buckets
        ?.find((bucket) => bucket.key === year)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 1)?.by_unique_project?.value ?? 0),
      marker: { enabled: false },
      name: [instrument.key, getI18nLabel(i18n, 'coordinator')].join(' - '),
    });
    seriesProject.push({
      color: getCssColor({ name: instrument.key, prefix: "instrument" }),
      data: years.map((year) => instrument?.by_project_year?.buckets
        ?.find((bucket) => bucket.key === year)?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 0)?.by_unique_project?.value ?? 0),
      marker: { enabled: false },
      name: [instrument.key, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    });
    seriesProjectRegion.push({
      color: getCssColor({ name: instrument.key, prefix: "instrument" }),
      data: years.map((year) => instrument
        ?.by_project_year?.buckets?.find((bucket) => bucket.key === year)
        ?.by_unique_project?.value ?? 0),
      marker: { enabled: false },
      name: instrument.key,
    });
  });

  // If view by number of projects
  let axis = getI18nLabel(i18n, 'number_of_projects_funded');
  let series = structure ? seriesProject.reverse() : seriesProjectRegion.reverse();
  let title = `Evolution temporelle des instruments européens (actions) dont a bénéficié ${structure ? "l'établissement" : "la région"} ${name}`;
  let tooltip = function (this: any) {
    return `<b>${this.y}</b> projets <b>${this.series.name}</b> en <b>${this.x}</b> dont a bénéficié ${structure ? "l'établissement" : "la région"} <b>${name}</b>`;
  };
  switch (selectedControl) {
    // If view by global amount
    case 'amount_global':
      axis = getI18nLabel(i18n, 'funding_total');
      series = structure ? seriesBudget.reverse() : seriesBudgetRegion.reverse();
      title = `Evolution temporelle du financement global par instrument européen dont a bénéficié ${structure ? "l'établissement" : "la région"} ${name}`;
      tooltip = function (this: any) {
        return `<b>${formatCompactNumber(this.y)} €</b> ont été financés en <b>${this.x}</b> par l'instrument <b>${this.series.name}</b> dont a bénéficié ${structure ? "l'établissement" : "la région"} <b>${name}</b>`;
      };
      break;
    // If view by amount by structure
    case 'amount_by_structure':
      axis = getI18nLabel(i18n, structure ? 'funding_by_structure' : 'funding_by_region');
      series = structure ? seriesFunding.reverse() : seriesFundingRegion.reverse();
      title = `Evolution temporelle du financement perçu par instrument européen dont a bénéficié ${structure ? "l'établissement" : "la région"} ${name}`;
      tooltip = function (this: any) {
        return `<b>${formatCompactNumber(this.y)} €</b> ont été perçus en <b>${this.x}</b> par l'instrument <b>${this.series.name}</b> dont a bénéficié ${structure ? "l'établissement" : "la région"} <b>${name}</b>`;
      };
      break;
  };

  const config = {
    comment: {
      "fr": <>{`Ce graphique présente l’évolution temporelle du nombre de projets ou de leurs financements associés, ventilée par 
        instrument, pour les projets européens, à travers des lignes empilées permettant d’apprécier la contribution relative de 
        chacun dans le temps. ${structure ? "Le type de participation est distingué, en pointillé quand l'établissement est \
        coordinateur, en couleur simple s'il est partenaire non-coordinateur." : ""} Le financement global représente le volume 
        total de financements des projets auxquels participe ${structure ? "l'établissement" : "la région"}. Le financement perçu 
        approxime la part réelle allouée à chaque ${structure ? "établissement" : "région"} partenaire d’un projet (en 
        assimilant consommation et subvention pour le PIA).`}</>,
    },
    id: "instrumentsOverTimeForEurope",
    integrationURL: `/integration?chart_id=instrumentsOverTimeForEurope&${searchParams.toString()}`,
    title,
  };

  const options: HighchartsInstance.Options = {
    chart: { height: "800px", type: "area" },
    legend: { enabled: true, reversed: true },
    plotOptions: {
      area: {
        stacking: "normal",
        marker: {
          enabled: false,
          lineColor: "#666666",
          lineWidth: 1,
          symbol: "circle",
        },
      },
      series: { legendSymbol: "rectangle", pointStart: Number(years[0]) },
    },
    series,
    title: { text: "" },
    tooltip: { formatter: tooltip },
    xAxis: { categories: [], title: { text: "Année de début du projet" } },
    yAxis: { title: { text: axis } },
  };

  return (
    <div className={`chart-container chart-container--${color}`} id="instruments-over-time-for-europe">
      <Title as="h2" look="h6">
        {title}
      </Title>
      <SegmentedControl selectedControl={selectedControl} setSelectedControl={setSelectedControl} />
      {isLoading ? <DefaultSkeleton height="800px" /> : <ChartWrapperFundings config={config} hideTitle options={options} />}
    </div>
  );
}
