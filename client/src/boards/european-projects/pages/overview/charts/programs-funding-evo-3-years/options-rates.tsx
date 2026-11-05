import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";
import { normalizeIdForCssColorNames } from "../../../../utils";

export default function Options(data, displayType): HighchartsOptions {
  if (!data) return null;
  const rootStyles = getComputedStyle(document.documentElement);
  const years = new Set();

  const countryData = data.filter((item) => item.country !== "all")[0].data;

  countryData.find((item) => item.stage === "evaluated").programs[0].years.forEach((year) => years.add(year.year));

  return {
    chart: {
      type: "line",
      height: 500,
      backgroundColor: "transparent",
    },
    title: { text: "" },
    legend: { enabled: false },
    credits: { enabled: false },
    xAxis: [
      {
        type: "category" as const,
        categories: Array.from(years).map(String),
        width: "100%",
        title: {
          text: "Projets évalués",
        },
      },
    ],
    plotOptions: {
      line: {
        marker: {
          enabled: true,
          symbol: "circle",
          radius: 3,
          lineWidth: 2,
          lineColor: undefined,
        },
        dataLabels: {
          enabled: true,
          formatter: function (this: any) {
            return `${Number(this.y).toFixed(1)}%`;
          },
        },
      },
    },
    series: countryData
      .find((item) => item.stage === "evaluated")
      .programs.map((program) => {
        const successfulPillarData = countryData
          .find((item) => item.stage === "successful")
          .programs.find((p) => p.programme_code === program.programme_code);

        return {
          name: program.programme_name_fr,
          data: program.years.map((year, index) => {
            const evaluatedAmount = year[displayType];
            const successfulAmount = successfulPillarData.years[index][displayType];
            return evaluatedAmount > 0 ? (successfulAmount / evaluatedAmount) * 100 : 0;
          }),
          color: rootStyles.getPropertyValue(`--program-${normalizeIdForCssColorNames(program.programme_code)}-color`),
        };
      }),
  } as HighchartsOptions;
}
