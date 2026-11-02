import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { getCssColor } from "../../../../../../utils/colors";
import { formatToMillions } from "../../../../../../utils/format";

import i18n from "./i18n.json";

export default function Options(data, currentLang) {
  if (!data) return null;

  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  interface DataItem {
    acronym?: string;
    entity_name?: string;
    total_fund_eur_coordination: number;
    total_fund_eur_partner: number;
  }

  interface ChartSeriesData {
    type: "bar";
    name: string;
    data: number[];
    color: string;
  }

  const sortedData = [...(data as DataItem[])].sort(
    (a, b) => b.total_fund_eur_coordination + b.total_fund_eur_partner - (a.total_fund_eur_coordination + a.total_fund_eur_partner),
  );

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  const newOptions: HighchartsInstance.Options = {
    chart: {
      height: sortedData.length * 30 + 150,
    },
    xAxis: {
      categories: sortedData.map((item) => item.acronym || item.entity_name || ""),
    },
    yAxis: {
      min: 0,
      title: {
        text: "Euros € (millions)",
      },
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    series: [
      {
        type: "bar",
        name: getI18nLabel("partner"),
        data: sortedData.map((item) => item.total_fund_eur_partner || 0),
        color: getCssColor("partner-color"),
      },
      {
        type: "bar",
        name: getI18nLabel("coordinator"),
        data: sortedData.map((item) => item.total_fund_eur_coordination || 0),
        color: getCssColor("coordination-color"),
      },
    ] as ChartSeriesData[],
    tooltip: {
      pointFormat: getI18nLabel("total-subsidies") + " en tant que {series.name} : " + "<b>{point.y:,.0f}</b> €",
    },
    plotOptions: {
      series: {
        stacking: "normal",
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatToMillions(this.y ?? 0);
          },
        },
      },
      bar: {
        pointWidth: 25,
        borderWidth: 0,
        borderRadius: 0,
      },
    },
    legend: {
      enabled: true,
      labelFormatter: function () {
        return capitalize(this.name);
      },
    },
  };

  return CreateChartOptions("bar", newOptions);
}
