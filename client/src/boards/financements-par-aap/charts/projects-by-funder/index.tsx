import { Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import DefaultSkeleton from "../../../../components/charts-skeletons/default.tsx";
import { useChartColor } from "../../../../hooks/useChartColor.tsx";
import { getI18nLabel } from "../../../../utils.tsx";
import ChartWrapperFundings from "../../components/chart-wrapper-fundings";
import SegmentedControl from "../../components/segmented-control/index.tsx";
import i18n from "../../i18n.json";
import { formatCompactNumber, formatPercent, funders, getCssColor, getEsQuery, getYearRangeLabel, pattern } from "../../utils.ts";

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env;

export default function ProjectsByFunder({ name }: { name: string | undefined }) {
  const [searchParams] = useSearchParams()
  const [selectedControl, setSelectedControl] = useState("projects")
  const region = searchParams.get("region")
  const structure = searchParams.get("structureId")
  const yearMax = searchParams.get("yearMax")
  const yearMin = searchParams.get("yearMin")
  const color = useChartColor()

  const body = {
    ...getEsQuery({ regions: [region], structures: [structure], yearMax, yearMin }),
    aggregations: {
      by_project_type: {
        terms: {
          field: "project_type.keyword",
          size: 50,
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
  };


  const { data, isLoading } = useQuery({
    queryKey: ["fundings-projects-by-funder", region, structure, yearMax, yearMin],
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

  const seriesBudget: any[] = [];
  const seriesFunding: any[] = [];
  const seriesProject: any[] = [];
  const seriesBudgetRegion: any = [];
  const seriesFundingRegion: any = [];
  const seriesProjectRegion: any = [];
  const categories: string[] = [];
  funders.forEach((funder, index) => {
    const funderData = (data?.aggregations?.by_project_type?.buckets ?? []).find((bucket) => bucket.key === funder);
    const isCoord = funderData?.is_coordinator?.buckets?.find((bucket) => bucket.key === 1);
    const isNotCoord = funderData?.is_coordinator?.buckets?.find((bucket) => bucket.key === 0);
    const isCoordBudget = isCoord?.should_ignore_budget?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0;
    const isNotCoordBudget = isNotCoord?.should_ignore_budget?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0;
    seriesBudget.push({
      color: getCssColor({ name: funder, prefix: "funder" }),
      data: [{ name: funder, x: index, y: isNotCoordBudget, y_perc: isNotCoordBudget === 0 ? 0 : isNotCoordBudget / (isCoordBudget + isNotCoordBudget), total: isCoordBudget + isNotCoordBudget, color: getCssColor({ name: funder, prefix: "funder" }) }],
      name: [funder, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    });
    seriesBudget.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: funder, prefix: "funder" }) } },
      data: [{ name: funder, x: index, y: isCoordBudget, y_perc: isCoordBudget === 0 ? 0 : isCoordBudget / (isCoordBudget + isNotCoordBudget), total: isCoordBudget + isNotCoordBudget, color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: funder, prefix: "funder" }) } } }],
      name: [funder, getI18nLabel(i18n, 'coordinator')].join(' - '),
    });
    seriesBudgetRegion.push({
      color: getCssColor({ name: funder, prefix: "funder" }),
      data: [{ name: funder, x: index, y: funderData?.should_ignore_budget?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0, y_perc: 0, total: 0, color: getCssColor({ name: funder, prefix: "funder" }) }],
      name: funder,
    })
    const isCoordFunding = isCoord?.should_ignore_funding?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0;
    const isNotCoordFunding = isNotCoord?.should_ignore_funding?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0;
    seriesFunding.push({
      color: getCssColor({ name: funder, prefix: "funder" }),
      data: [{ name: funder, x: index, y: isNotCoordFunding, y_perc: isNotCoordFunding === 0 ? 0 : isNotCoordFunding / (isCoordFunding + isNotCoordFunding), total: isCoordFunding + isNotCoordFunding, color: getCssColor({ name: funder, prefix: "funder" }) }],
      name: [funder, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    });
    seriesFunding.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: funder, prefix: "funder" }) } },
      data: [{ name: funder, x: index, y: isCoordFunding, y_perc: isCoordFunding === 0 ? 0 : isCoordFunding / (isCoordFunding + isNotCoordFunding), total: isCoordFunding + isNotCoordFunding, color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: funder, prefix: "funder" }) } } }],
      name: [funder, getI18nLabel(i18n, 'coordinator')].join(' - '),
    });
    seriesFundingRegion.push({
      color: getCssColor({ name: funder, prefix: "funder" }),
      data: [{ name: funder, x: index, y: funderData?.should_ignore_funding?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0, y_perc: 0, total: 0, color: getCssColor({ name: funder, prefix: "funder" }) }],
      name: funder,
    });
    const isCoordProject = isCoord?.by_unique_project?.value ?? 0;
    const isNotCoordProject = isNotCoord?.by_unique_project?.value ?? 0;
    seriesProject.push({
      color: getCssColor({ name: funder, prefix: "funder" }),
      data: [{ name: funder, x: index, y: isNotCoordProject, y_perc: isNotCoordProject === 0 ? 0 : isNotCoordProject / (isCoordProject + isNotCoordProject), total: isCoordProject + isNotCoordProject, color: getCssColor({ name: funder, prefix: "funder" }) }],
      name: [funder, getI18nLabel(i18n, 'not-coordinator')].join(' - '),
    });
    seriesProject.push({
      color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: funder, prefix: "funder" }) } },
      data: [{ name: funder, x: index, y: isCoordProject, y_perc: isCoordProject === 0 ? 0 : isCoordProject / (isCoordProject + isNotCoordProject), total: isCoordProject + isNotCoordProject, color: { pattern: { ...pattern, backgroundColor: getCssColor({ name: funder, prefix: "funder" }) } } }],
      name: [funder, getI18nLabel(i18n, 'coordinator')].join(' - '),
    });
    seriesProjectRegion.push({
      color: getCssColor({ name: funder, prefix: "funder" }),
      data: [{ name: funder, x: index, y: funderData?.by_unique_project?.value ?? 0, y_perc: 0, total: 0, color: getCssColor({ name: funder, prefix: "funder" }) }],
      name: funder,
    });
    categories.push(funder);
  });

  // If view by number of projects
  let axis = getI18nLabel(i18n, 'number_of_projects_funded');
  let dataLabel = function (this: any) {
    return `${this.y} projet${this.y > 1 ? 's' : ''} (${formatPercent(this.y_perc)})`;
  };
  let series = structure ? seriesProject : seriesProjectRegion;
  let stackLabel = function (this: any) {
    return `${this.total} projet${this.total > 1 ? 's' : ''}`;
  };
  let title = `Nombre de projets financés auxquels ${structure ? "l'établissement" : "la région"} ${name} participe, réparti par financeur ${getYearRangeLabel({ yearMax, yearMin })}`;
  let tooltip = function (this: any) {
    return `<b>${this.y}</b> projets <b>${this.series.name}</b> auxquels participe <b>${name}</b> ${getYearRangeLabel({ isBold: true, yearMax, yearMin })}, soit ${formatPercent(this.y_perc)} (${this.y} / ${this.total} )`;
  };
  switch (selectedControl) {
    // If view by global amount
    case 'amount_global':
      axis = getI18nLabel(i18n, 'funding_total');
      dataLabel = function (this: any) {
        return `${formatCompactNumber(this.y)} €  (${formatPercent(this.y_perc)})`;
      };
      series = structure ? seriesBudget : seriesBudgetRegion;
      stackLabel = function (this: any) {
        return `${formatCompactNumber(this.total)} €`;
      };
      title = `Montant total des projets auxquels ${structure ? "l'établissement" : "la région"} ${name} participe, réparti par financeur ${getYearRangeLabel({ yearMax, yearMin })}`;
      tooltip = function (this: any) {
        return `<b>${formatCompactNumber(this.y)} €</b> financés ${getYearRangeLabel({ isBold: true, yearMax, yearMin })} pour les projets <b>${this.series.name}</b> auxquels participe <b>${name}</b>, soit ${formatPercent(this.y_perc)} (${formatCompactNumber(this.y)} € / ${formatCompactNumber(this.total)}  €)`;
      };
      break;
    // If view by amount by structure
    case 'amount_by_structure':
      axis = getI18nLabel(i18n, structure ? 'funding_by_structure' : 'funding_by_region');
      dataLabel = function (this: any) {
        return `${formatCompactNumber(this.y)} €  (${formatPercent(this.y_perc)})`;
      };
      series = structure ? seriesFunding : seriesFundingRegion;
      stackLabel = function (this: any) {
        return `${formatCompactNumber(this.total)} €`;
      };
      title = `Financement perçu pour des projets auxquels ${structure ? "l'établissement" : "la région"} ${name} participe, réparti par financeur ${getYearRangeLabel({ yearMax, yearMin })}`;
      tooltip = function (this: any) {
        return `<b>${formatCompactNumber(this.y)} €</b> perçus ${getYearRangeLabel({ isBold: true, yearMax, yearMin })} pour les projets <b>${this.series.name}</b> auxquels participe <b>${name}</b>, soit ${formatPercent(this.y_perc)} (${formatCompactNumber(this.y)} € / ${formatCompactNumber(this.total)}  €)`;
      };
      break;
  };

  const config = {
    comment: {
      "fr": <>{`Ce graphique indique, par financeur, le nombre, les financements globaux et les financements perçus des projets 
        auxquels participe ${structure ? "l'établissement" : "la région"}. ${structure ? "Pour chaque financeur, la barre \
        correspondante est subdivisée en deux en fonction du rôle de l'établissement : la partie pointillée quand l'établissement \
        est coordinateur, en couleur simple quand il est partenaire non coordinateur." : ""} Le financement global représente 
        le volume total de financements des projets auxquels participe ${structure ? "l'établissement" : "la région"}. Le 
        financement perçu approxime la part réelle allouée à chaque ${structure ? "établissement" : "région"} partenaire 
        d’un projet (en assimilant consommation et subvention pour le PIA).`}</>,
    },
    id: "projectsByFunder",
    integrationURL: `/integration?chart_id=projectsByFunder&${searchParams.toString()}`,
    title,
  };

  const options: HighchartsInstance.Options = {
    legend: { enabled: true },
    plotOptions: {
      bar: {
        dataLabels: {
          align: "right",
          enabled: false,
          formatter: dataLabel,
        },
        stacking: "normal",
      },
    },
    series,
    tooltip: { formatter: tooltip },
    xAxis: {
      categories,
      title: { text: "" },
    },
    yAxis: {
      stackLabels: {
        enabled: true,
        style: {
          fontWeight: "bold",
        },
        formatter: stackLabel,
      },
      title: { text: axis }
    },
  };

  return (
    <div className={`chart-container chart-container--${color}`} id="projects-by-funder">
      <Title as="h2" look="h6">
        {title}
      </Title>
      <SegmentedControl selectedControl={selectedControl} setSelectedControl={setSelectedControl} />
      {isLoading ? <DefaultSkeleton height="600px" /> : <ChartWrapperFundings config={config} hideTitle options={options} />}
    </div>
  );
}
