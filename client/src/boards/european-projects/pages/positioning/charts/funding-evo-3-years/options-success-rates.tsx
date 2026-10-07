import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";

import { formatToPercent } from "../../../../../../utils/format";
import i18n from "../../../../i18n-global.json";
import { CreateChartOptions } from "../../../../components/chart-ep";

export default function Options(data, currentLang): HighchartsOptions {
  if (!data) return null;
  const rootStyles = getComputedStyle(document.documentElement);
  const evaluatedYears = new Set<string>();

  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  data.evaluated.forEach((country) => {
    country.data.forEach((y) => {
      evaluatedYears.add(y.year);
    });
  });

  const yearsArray = Array.from(evaluatedYears);
  yearsArray.sort((a, b) => parseInt(a) - parseInt(b));

  const newOptions: HighchartsInstance.Options = {
    xAxis: {
      type: "category" as const,
      categories: yearsArray.map(String),
      title: {
        text: getI18nLabel("evaluated-projects"),
      },
    },
    yAxis: [
      {
        lineWidth: 1,
        lineColor: "#E6E6E6",
        min: 0,
        title: {
          text: "%",
        },
        labels: {
          formatter: function () {
            return formatToPercent(this.value as number);
          },
        },
      },
      {
        min: 0,
        title: {
          text: "",
        },
        lineWidth: 1,
        lineColor: "#E6E6E6",
        left: "75%",
        labels: {
          formatter: function () {
            return formatToPercent(this.value as number);
          },
        },
      },
    ],
    tooltip: {
      formatter: function () {
        return `${this.x}<br>${this.series.name} : ${formatToPercent(this.y as number)}`;
      },
    },
    plotOptions: {
      line: {
        marker: {
          enabled: true,
          symbol: "circle",
          radius: 3,
          lineWidth: 2,
        },
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatToPercent(this.y as number);
          },
        },
      },
    },
    series: data.evaluated.map((country, index) => ({
      name: country[`name_${currentLang}`],
      data: country.data.map((year) => {
        const totalSuccessful = data.successful.find((c) => c.id === country.id).data.find((y) => y.year === year.year)?.total_fund_eur || 0;
        return (totalSuccessful / year.total_fund_eur) * 100;
      }),
      color: rootStyles.getPropertyValue(`--scale-${index}-color`),
    })),
  };

  return CreateChartOptions("line", newOptions) as HighchartsOptions;
}
