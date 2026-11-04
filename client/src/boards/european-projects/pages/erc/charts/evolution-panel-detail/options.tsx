import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import type { EvolutionPanelDetailData, EvolutionPanelDetailItem } from "./query";

// Fonction de tri naturel pour les panel_id (ex: PE1, PE2, PE10 au lieu de PE1, PE10, PE2)
function naturalSortPanelId(a: string, b: string): number {
  const regex = /^([A-Z]+)(\d+)$/;
  const matchA = a.match(regex);
  const matchB = b.match(regex);

  if (matchA && matchB) {
    const prefixCompare = matchA[1].localeCompare(matchB[1]);
    if (prefixCompare !== 0) return prefixCompare;
    return parseInt(matchA[2], 10) - parseInt(matchB[2], 10);
  }
  return a.localeCompare(b);
}

interface OptionsEvolutionProps {
  data: EvolutionPanelDetailData;
  domain: string;
  chartType: "weight" | "successRate";
}

export default function OptionsEvolution({ data, domain, chartType }: OptionsEvolutionProps): HighchartsInstance.Options | null {
  if (!data || !data.country || !data.total) return null;

  // Filtrer par domaine sélectionné
  const countrySuccessful = data.country.successful.filter((item) => item.domaine_scientifique === domain);
  const countryEvaluated = data.country.evaluated.filter((item) => item.domaine_scientifique === domain);
  const totalSuccessful = data.total.successful.filter((item) => item.domaine_scientifique === domain);

  if (countrySuccessful.length === 0 && countryEvaluated.length === 0) return null;

  // Récupérer toutes les années uniques triées
  const yearsSet = new Set<string>();
  [...countrySuccessful, ...countryEvaluated, ...totalSuccessful].forEach((item) => {
    yearsSet.add(item.call_year);
  });
  const years = Array.from(yearsSet).sort();

  // Récupérer tous les panels uniques triés
  const panelsSet = new Set<string>();
  [...countrySuccessful, ...countryEvaluated].forEach((item) => {
    panelsSet.add(item.panel_id);
  });
  const panels = Array.from(panelsSet).sort(naturalSortPanelId);

  // Créer une map panel_id -> panel_name
  const panelNamesMap = new Map<string, string>();
  [...countrySuccessful, ...countryEvaluated].forEach((item) => {
    if (!panelNamesMap.has(item.panel_id) && item.panel_name) {
      panelNamesMap.set(item.panel_id, item.panel_name);
    }
  });

  // Créer des maps pour accès rapide
  const createDataMap = (items: EvolutionPanelDetailItem[]) => {
    const map = new Map<string, EvolutionPanelDetailItem>();
    items.forEach((item) => {
      map.set(`${item.call_year}-${item.panel_id}`, item);
    });
    return map;
  };

  const countrySuccessfulMap = createDataMap(countrySuccessful);
  const countryEvaluatedMap = createDataMap(countryEvaluated);
  const totalSuccessfulMap = createDataMap(totalSuccessful);

  // Créer les séries
  const series = panels.map((panelId) => {
    const seriesData = years.map((year) => {
      const key = `${year}-${panelId}`;

      if (chartType === "weight") {
        // Poids = (PI pays / PI total) * 100
        const countryItem = countrySuccessfulMap.get(key);
        const totalItem = totalSuccessfulMap.get(key);

        if (!countryItem || !totalItem || totalItem.total_pi === 0) {
          return null;
        }

        const weight = (countryItem.total_pi / totalItem.total_pi) * 100;
        return Math.round(weight * 10) / 10;
      } else {
        // Taux de succès = (PI lauréats / PI évalués) * 100
        const countrySuccessfulItem = countrySuccessfulMap.get(key);
        const countryEvaluatedItem = countryEvaluatedMap.get(key);

        if (!countrySuccessfulItem || !countryEvaluatedItem || countryEvaluatedItem.total_pi === 0) {
          return null;
        }

        const successRate = (countrySuccessfulItem.total_pi / countryEvaluatedItem.total_pi) * 100;
        return Math.round(successRate * 10) / 10;
      }
    });

    return {
      name: panelNamesMap.get(panelId) || panelId,
      data: seriesData,
    };
  });

  const newOptions: HighchartsInstance.Options = {
    xAxis: {
      categories: years,
      title: {
        text: "",
      },
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    yAxis: {
      title: {
        text: "",
      },
      labels: {
        format: "{value}%",
        style: {
          fontSize: "12px",
        },
      },
      min: 0,
      gridLineWidth: 0.5,
      gridLineColor: "#e0e0e0",
    },
    tooltip: {
      shared: true,
      useHTML: true,
      headerFormat: "<b>{point.key}</b><br/>",
      pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y}%</b><br/>',
    },
    legend: {
      enabled: true,
      layout: "horizontal",
      align: "center",
      verticalAlign: "bottom",
      itemStyle: {
        fontSize: "11px",
      },
    },
    plotOptions: {
      line: {
        lineWidth: 2,
        marker: {
          enabled: true,
          radius: 3,
        },
        states: {
          hover: {
            lineWidth: 3,
          },
        },
      },
    },
    series: series.map((s) => ({
      type: "line" as const,
      name: s.name,
      data: s.data,
      connectNulls: false,
    })),
  };

  return CreateChartOptions("line", newOptions);
}
