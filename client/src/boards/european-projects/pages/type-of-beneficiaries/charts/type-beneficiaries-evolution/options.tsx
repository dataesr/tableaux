import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { getCssColor } from "../../../../../../utils/colors";

import i18n from "./i18n.json";

export default function Options(data, currentLang, selectedCountry?: string) {
  if (!data || !data.countries || !data.years) return null;

  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  // Générer des couleurs pour chaque pays depuis l'échelle définie dans colors.scss
  const selectedCountryColor = getCssColor("selected-country-color");
  const countryColors = Array.from({ length: 10 }, (_, i) => getCssColor(`scale-${i + 1}-color`));

  const newOptions: HighchartsInstance.Options = {
    chart: {
      type: "line",
      height: 600,
    },
    xAxis: {
      categories: data.years,
      // title: {
      //   text: getI18nLabel("years"),
      // },
      crosshair: true,
      accessibility: {
        description: "Years",
      },
    },
    yAxis: {
      title: {
        text: getI18nLabel("fund_eur"),
      },
      labels: {
        formatter: function () {
          return ((this.value as number) / 1000000).toFixed(1) + "M€";
        },
      },
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    tooltip: {
      shared: true,
      formatter: function () {
        let tooltip = `<b>Année: ${this.x}</b><br/>`;
        if (this.points) {
          this.points.forEach((point) => {
            const value = point.y || 0;
            tooltip += `${point.series.name}: <b>${(value / 1000000).toFixed(2)}M€</b><br/>`;
          });
        }
        return tooltip;
      },
    },
    legend: {
      enabled: true,
      layout: "horizontal",
      align: "center",
      verticalAlign: "bottom",
    },
    plotOptions: {
      line: {
        marker: {
          enabled: true,
          radius: 4,
        },
        lineWidth: 2,
        states: {
          hover: {
            lineWidth: 3,
          },
        },
      },
    },
    series: data.countries.map((country, index) => ({
      name: country[`country_name_${currentLang}`] || country.country_code,
      data: country.evolution.map((item) => item.total_fund_eur),
      type: "line",
      color: selectedCountry && country.country_code === selectedCountry ? selectedCountryColor : countryColors[index % countryColors.length],
      marker: {
        symbol: "circle",
      },
    })),
  };

  return CreateChartOptions("line", newOptions);
}
