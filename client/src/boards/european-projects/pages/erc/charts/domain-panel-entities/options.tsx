import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import { formatCurrency, formatToMillions } from "../../../../../../utils/format";
import { getCssColor } from "../../../../../../utils/colors";
import type { ErcDomainPanelEntitiesData } from "./query";

export default function Options(data: ErcDomainPanelEntitiesData, currentLang: string, metric: string): HighchartsInstance.Options | null {
  if (!data?.list?.length) return null;

  const getMetricValue = (item: any) => {
    switch (metric) {
      case "pi":
        return item.total_pi ?? 0;
      case "projects":
        return item.total_projects ?? 0;
      case "funding":
      default:
        return item.total_fund_eur ?? 0;
    }
  };

  const formatValue = (value: number) => {
    switch (metric) {
      case "pi":
      case "projects":
        return String(Math.round(value));
      case "funding":
      default:
        return formatToMillions(value);
    }
  };

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
    // tooltip: {
    //   pointFormat: (currentLang === "fr" ? "Financement obtenu : " : "Total funding: ") + "<b>{point.y:,.0f}</b> €",
    // },
    tooltip: {
      formatter: function () {
        const ctx = this as unknown as { point: { name: string }; y: number };
        const label = metric === "pi" ? (currentLang === "fr" ? "Porteurs de projets" : "Project PIs") : metric === "projects" ? (currentLang === "fr" ? "Projets" : "Projects") : (currentLang === "fr" ? "Financements obtenus" : "Secured funding");
        const value = metric === "funding" ? formatCurrency(this.y ?? 0) : String(Math.round(this.y ?? 0));
        return `<b>${ctx.point.name}</b><br/>${label} : <b>${value}</b>`;
      },
    },
    series: [
      {
        type: "bar",
        name: metric === "pi" ? (currentLang === "fr" ? "Porteurs de projets" : "Project PIs") : metric === "projects" ? (currentLang === "fr" ? "Projets" : "Projects") : metric === "funding" ? (currentLang === "fr" ? "Financements obtenus (M€)" : "Secured funding (€M)") : "",
        color: getCssColor("main-partner"),
        groupPadding: 0,
        data: data.list.map((item) => [item.acronym || item.name, getMetricValue(item)]),
      },
    ],
    plotOptions: {
      series: {
        animation: false,
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return formatValue(this.y ?? 0);
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
