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
import { formatCompactNumber, getCssColor, getEsQuery, getYearRangeLabel, pattern } from "../../utils.ts";

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env;

export default function InstrumentsForAnr({ name }: { name: string | undefined }) {
  const [selectedControl, setSelectedControl] = useState("projects")
  const [searchParams] = useSearchParams()
  const region = searchParams.get("region")
  const structure = searchParams.get("structureId")
  const yearMax = searchParams.get("yearMax")
  const yearMin = searchParams.get("yearMin")
  const color = useChartColor()

  const body = {
    ...getEsQuery({ regions: [region], structures: [structure], yearMax, yearMin }),
    aggregations: {
      by_instrument_project: {
        terms: {
          field: "project_instrument.keyword",
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
            },
          },
          by_unique_project: {
            cardinality: {
              field: "project_id.keyword",
            },
          },
        },
      },
      by_instrument_budget: {
        terms: {
          field: "project_instrument.keyword",
          order: { "sum_budget": "desc" },
        },
        aggregations: {
          sum_budget: {
            sum: {
              field: "project_budgetFinanced",
            },
          },
          is_coordinator: {
            terms: {
              field: "participation_is_coordinator",
            },
            aggregations: {
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
        },
      },
      by_instrument_funding: {
        terms: {
          field: "project_instrument.keyword",
          order: { "sum_funding": "desc" },
        },
        aggregations: {
          sum_funding: {
            sum: {
              field: "participation_funding",
            },
          },
          is_coordinator: {
            terms: {
              field: "participation_is_coordinator",
            },
            aggregations: {
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
  };
  body.query.bool.filter.push({ terms: { "project_type.keyword": ["ANR", "PIA ANR", "PIA hors ANR"] } });

  const { data, isLoading } = useQuery({
    queryKey: ["fundings-instruments-for-anr", region, structure, yearMax, yearMin],
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
  const instrumentsBudget = data?.aggregations?.by_instrument_budget?.buckets ?? [];
  const instrumentsFunding = data?.aggregations?.by_instrument_funding?.buckets ?? [];
  const instrumentsProject = data?.aggregations?.by_instrument_project?.buckets ?? [];
  instrumentsBudget.forEach((instrument) => {
    seriesBudget.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: instrument.key, prefix: "instrument" }) } },
      name: [instrument.key, getI18nLabel(i18n, 'coordinator')].join(' - '),
      value: instrument?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 1)?.should_ignore_budget?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0,
    });
    seriesBudget.push({
      color: getCssColor({ name: instrument.key, prefix: "instrument" }),
      name: [instrument.key, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
      value: instrument?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 0)?.should_ignore_budget?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0,
    });
    seriesBudgetRegion.push({
      color: getCssColor({ name: instrument.key, prefix: "instrument" }),
      name: instrument.key,
      value: instrument?.should_ignore_budget?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0,
    });
  });
  instrumentsFunding.forEach((instrument) => {
    seriesFunding.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: instrument.key, prefix: "instrument" }) } },
      name: [instrument.key, getI18nLabel(i18n, 'coordinator')].join(' - '),
      value: instrument?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 1)?.should_ignore_funding?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0,
    });
    seriesFunding.push({
      color: getCssColor({ name: instrument.key, prefix: "instrument" }),
      name: [instrument.key, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
      value: instrument?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 0)?.should_ignore_funding?.buckets
        ?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0,
    });
    seriesFundingRegion.push({
      color: getCssColor({ name: instrument.key, prefix: "instrument" }),
      name: instrument.key,
      value: instrument?.should_ignore_funding?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0,
    });
  });
  instrumentsProject.forEach((instrument) => {
    seriesProject.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: instrument.key, prefix: "instrument" }) } },
      name: [instrument.key, getI18nLabel(i18n, 'coordinator')].join(' - '),
      value: instrument?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 1)?.by_unique_project?.value ?? 0,
    });
    seriesProject.push({
      color: getCssColor({ name: instrument.key, prefix: "instrument" }),
      name: [instrument.key, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
      value: instrument?.is_coordinator?.buckets
        ?.find((bucket) => bucket.key === 0)?.by_unique_project?.value ?? 0,
    });
    seriesProjectRegion.push({
      color: getCssColor({ name: instrument.key, prefix: "instrument" }),
      name: instrument.key,
      value: instrument?.by_unique_project?.value ?? 0,
    });
  });

  const title = `Instruments ANR pour les projets auxquels participe ${structure ? "l'établissement" : "la région"} ${name} ${getYearRangeLabel({ yearMax, yearMin })}`;
  // If view by number of projects
  let series = structure ? seriesProject.reverse() : seriesProjectRegion.reverse();
  let tooltip = function (this: any) {
    return `<b>${this.value}</b> projets ANR auxquels participe ${structure ? "l'établissement" : "la région"} <b>${name}</b> au moyen de l'instrument <b>${this.name}</b> ${getYearRangeLabel({ isBold: true, yearMax, yearMin })}`;
  };
  switch (selectedControl) {
    // If view by global amount
    case 'amount_global':
      series = structure ? seriesBudget.reverse() : seriesBudgetRegion.reverse();
      tooltip = function (this: any) {
        return `<b>${formatCompactNumber(this.value)} €</b> financés au global pour les projets ANR auxquels participe ${structure ? "l'établissement" : "la région"} <b>${name}</b> au moyen de l'instrument <b>${this.name}</b> ${getYearRangeLabel({ isBold: true, yearMax, yearMin })}`;
      };
      break;
    // If view by amount by structure
    case 'amount_by_structure':
      series = structure ? seriesFunding.reverse() : seriesFundingRegion.reverse();
      tooltip = function (this: any) {
        return `<b>${formatCompactNumber(this.value)} €</b> perçus par ${structure ? "l'établissement" : "la région"} <b>${name}</b> pour les projets ANR au moyen de l'instrument <b>${this.name}</b> ${getYearRangeLabel({ isBold: true, yearMax, yearMin })}`;
      };
      break;
  };

  const config = {
    comment: {
      "fr": <>{`Ce graphe présente la distribution des projets auxquels participe ${structure ? "l'établissement" : "la région"}, 
        par type d'instrument, pour les projets ANR. ${structure ? "Le type de participation est distingué, en pointillé quand \
        l'établissement est coordinateur, en couleur simple s'il est partenaire non-coordinateur." : ""} Le financement global 
        représente le volume total de financements des projets auxquels participe ${structure ? "l'établissement" : "la région"}. 
        Le financement perçu approxime la part réelle allouée à chaque ${structure ? "établissement" : "région"} partenaire d’un 
        projet (en assimilant consommation et subvention pour le PIA).`}</>,
    },
    id: "instrumentsForAnr",
    integrationURL: `/integration?chart_id=instrumentsForAnr&${searchParams.toString()}`,
    title,
  };

  const options: HighchartsInstance.Options = {
    chart: { type: "treemap" },
    legend: { enabled: true },
    plotOptions: {
      treemap: {
        dataLabels: {
          style: {
            color: "black",
            fontWeight: "bold",
            fontSize: "14px",
            textOutline: "1px contrast",
          },
        },
      },
    },
    series: [{ data: series, layoutAlgorithm: "squarified", type: "treemap" }],
    title: { text: "" },
    tooltip: { formatter: tooltip },
  };

  return (
    <div className={`chart-container chart-container--${color}`} id="instruments-for-anr">
      <Title as="h2" look="h6">
        {title}
      </Title>
      <SegmentedControl selectedControl={selectedControl} setSelectedControl={setSelectedControl} />
      {isLoading ? <DefaultSkeleton height="600px" /> : <ChartWrapperFundings config={config} hideTitle options={options} />}
    </div>
  );
};
