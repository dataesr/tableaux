import type { HighchartsOptions } from "../../../../../../components/chart-wrapper";
import { formatToPercentLang } from "../../../../../../utils/format";

export default function Options(data, displayType, currentLang: "fr" | "en" = "fr"): HighchartsOptions {
  if (!data) return null;
  const rootStyles = getComputedStyle(document.documentElement);
  const years = new Set();

  const countryData = data.filter((item) => item.country !== "all")[0].data;

  countryData.find((item) => item.stage === "evaluated").pillars[0].years.forEach((year) => years.add(year.year));

  return {
    chart: {
      type: "line",
      height: 500,
      backgroundColor: "transparent",
    },
    title: { text: "" },
    legend: {
      enabled: true,
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
    },
    credits: { enabled: false },
    xAxis: [
      {
        type: "category" as const,
        categories: Array.from(years).map(String),
        width: "100%",
        title: {
          enabled: false,
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
            return formatToPercentLang(this.y ?? 0, currentLang);
          },
        },
      },
    },
    series: countryData
      .find((item) => item.stage === "evaluated")
      .pillars.map((pillar) => {
        const successfulPillarData = countryData
          .find((item) => item.stage === "successful")
          .pillars.find((p) => p.pilier_code === pillar.pilier_code);

        return {
          name: pillar.pilier_name_fr,
          data: pillar.years.map((year, index) => {
            const evaluatedAmount = year[displayType];
            const successfulAmount = successfulPillarData.years[index][displayType];
            return evaluatedAmount > 0 ? (successfulAmount / evaluatedAmount) * 100 : 0;
          }),
          color: rootStyles.getPropertyValue(`--pillar-${pillar.pilier_code}-color`),
        };
      }),
  } as HighchartsOptions;
}
