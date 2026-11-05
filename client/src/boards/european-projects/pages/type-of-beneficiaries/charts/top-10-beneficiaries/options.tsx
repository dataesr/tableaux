import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { formatToMillions } from "../../../../../../utils/format";
import { CreateChartOptions } from "../../../../components/chart-ep";
import i18n from "./i18n.json";

const rootStyles = getComputedStyle(document.documentElement);

export default function Options(data, currentLang) {
  if (!data || !data.data || !Array.isArray(data.data)) return null;

  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  const newOptions: HighchartsInstance.Options = {
    xAxis: {
      categories: data.data.map((country) => country[`country_name_${currentLang}`]),
      crosshair: true,
      accessibility: {
        description: "Countries",
      },
    },
    yAxis: [
      {
        title: {
          text: "Euros (M€)",
        },
        gridLineColor: "var(--background-default-grey-hover)",
        gridLineWidth: 0.5,
      },
    ],
    legend: {
      enabled: true,
    },
    plotOptions: {
      series: {
        animation: false,
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatToMillions(this.y ?? 0);
          },
        },
      },
      column: {
        borderWidth: 0,
        borderRadius: 0,
      },
    },
    series: [
      {
        name: getI18nLabel("REC"),
        data: data.data.map((country) => country.types.find((item) => item.cordis_type_entity_code === "REC")?.total_fund_eur || 0),
        type: "column",
        color: rootStyles.getPropertyValue("--beneficiarie-type-REC-color"),
      },
      {
        name: getI18nLabel("HES"),
        data: data.data.map((country) => country.types.find((item) => item.cordis_type_entity_code === "HES")?.total_fund_eur || 0),
        type: "column",
        color: rootStyles.getPropertyValue("--beneficiarie-type-HES-color"),
      },
      {
        name: getI18nLabel("PUB"),
        data: data.data.map((country) => country.types.find((item) => item.cordis_type_entity_code === "PUB")?.total_fund_eur || 0),
        type: "column",
        color: rootStyles.getPropertyValue("--beneficiarie-type-PUB-color"),
      },
      {
        name: getI18nLabel("PRC"),
        data: data.data.map((country) => country.types.find((item) => item.cordis_type_entity_code === "PRC")?.total_fund_eur || 0),
        type: "column",
        color: rootStyles.getPropertyValue("--beneficiarie-type-PRC-color"),
      },
      {
        name: getI18nLabel("OTH"),
        data: data.data.map((country) => country.types.find((item) => item.cordis_type_entity_code === "OTH")?.total_fund_eur || 0),
        type: "column",
        color: rootStyles.getPropertyValue("--beneficiarie-type-OTH-color"),
      },
    ],
  };

  return CreateChartOptions("empty", newOptions);
}
