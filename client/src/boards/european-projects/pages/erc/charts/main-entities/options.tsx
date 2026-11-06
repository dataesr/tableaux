import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatCurrency } from "../../../../../../utils/format";
import { getCssColor } from "../../../../../../utils/colors";
import type { ErcMainEntitiesData } from "./query";

export default function Options(data: ErcMainEntitiesData, currentLang: string): HighchartsInstance.Options | null {
  if (!data?.list?.length) return null;

  const newOptions: HighchartsInstance.Options = {
    chart: {
      height: data.list.length * 30 + 150,
    },
    legend: { enabled: true },
    xAxis: {
      type: "category",
    },
    yAxis: {
      min: 0,
      title: {
        text: undefined,
      },
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    tooltip: {
      formatter: function () {
        const ctx = this as unknown as { point: { name: string }; y: number };
        return `<b>${ctx.point.name}</b><br/>Financement obtenu : <b>${formatCurrency(this.y ?? 0)}</b>`;
      },
    },
    series: [
      {
        type: "bar",
        name: currentLang === "fr" ? "Financements obtenus (M€)" : "Secured funding (€M)",
        color: getCssColor("main-partner"),
        groupPadding: 0,
        data: data.list.map((item) => [item.acronym || item.name, item.total_fund_eur]),
      },
    ],
    plotOptions: {
      series: {
        animation: false,
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatCurrency(this.y ?? 0);
          },
        },
      },
      bar: {
        pointWidth: 25,
        borderWidth: 0,
        borderRadius: 0,
      },
    },
  };

  return CreateChartOptions("bar", newOptions);
}
