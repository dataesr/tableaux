import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { getI18nLabel } from "../../../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";
import { formatToPercentLang } from "../../../../../../utils/format";
import { CreateChartOptions } from "../../../../components/chart-ep";
import i18n from "../../i18n-charts.json";
import { getProportionYAxisTitle } from "../../proportion-charts-text";
import { findItem, getName, getOrderedCodes, getProportionKey, type ProportionData } from "./utils";

const LEGENDS: Record<string, [string, string]> = {
  total_fund_eur: ["requestedFunding", "securedFunding"],
  total_coordination_number: ["evaluatedCoordinations", "successfulCoordinations"],
  total_number_involved: ["applicantsNumber", "participantsNumber"],
  total_projects: ["evaluatedProjects", "successfulProjects"],
};

export default function getOptions(data: ProportionData | null | undefined, displayType: string = "total_fund_eur", currentLang: "fr" | "en" = "fr") {
  const items = data?.data;
  if (!items || items.length === 0) return null;

  const valueKey = getProportionKey(displayType);
  const [legend01, legend02] = LEGENDS[displayType] ?? LEGENDS.total_fund_eur;

  // Catégories explicites dans l'ordre de l'API : séries alignées (évite le warning Highcharts #15)
  const codes = getOrderedCodes(items);
  const categories = codes.map((code) => getName(findItem(items, code, "evaluated") ?? findItem(items, code, "successful"), currentLang));
  const valuesFor = (stage: string) => codes.map((code) => findItem(items, code, stage)?.[valueKey] ?? 0);

  const dataLabels = {
    formatter: function (this: { y?: number | null }) {
      return formatToPercentLang(this.y ?? 0, currentLang);
    },
  };

  const newOptions: HighchartsInstance.Options = {
    xAxis: {
      categories,
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    yAxis: {
      min: 0,
      title: { text: getProportionYAxisTitle(currentLang) },
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    tooltip: { enabled: false },
    plotOptions: {
      series: {
        dataLabels: { enabled: true },
      },
      column: {
        borderWidth: 0,
        maxPointWidth: 90,
        groupPadding: 0.25, // espace entre les catégories (par défaut 0.2)
        pointPadding: 0.1, 
      },
    },
    series: [
      {
        type: "column",
        name: getI18nLabel(i18n, legend01, currentLang),
        color: getCssColor("evaluated-project"),
        data: valuesFor("evaluated"),
        dataLabels,
      },
      {
        type: "column",
        name: getI18nLabel(i18n, legend02, currentLang),
        color: getCssColor("successful-project"),
        data: valuesFor("successful"),
        dataLabels,
      },
    ],
  };

  return CreateChartOptions("column", newOptions);
}
