import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../../../../components/chart-ep";
import { getCssColor } from "../../../../../../utils/colors";
import type { GenderByDestinationData, GenderByDestinationItem } from "./query";

const DESTINATION_ORDER = ["STG", "COG", "ADG", "SyG", "POC"];

const DESTINATION_LABELS: Record<string, { fr: string; en: string }> = {
  STG: { fr: "Starting (STG)", en: "Starting (STG)" },
  COG: { fr: "Consolidator (COG)", en: "Consolidator (COG)" },
  ADG: { fr: "Advanced (ADG)", en: "Advanced (ADG)" },
  SyG: { fr: "Synergy (SyG)", en: "Synergy (SyG)" },
  POC: { fr: "Proof of Concept (POC)", en: "Proof of Concept (POC)" },
};

function getPercent(item: GenderByDestinationItem, gender: string): number {
  const found = item.genders.find((g) => g.gender === gender);
  if (!found || !item.total) return 0;
  return Math.round((found.count / item.total) * 1000) / 10;
}

export default function Options(data: GenderByDestinationData, currentLang: string): Highcharts.Options | null {
  if (!data?.byDestination?.length) return null;

  const sorted = DESTINATION_ORDER.map((code) => data.byDestination.find((d) => d.destination_code === code)).filter(
    (d): d is GenderByDestinationItem => !!d,
  );

  const categories = sorted.map((d) => DESTINATION_LABELS[d.destination_code]?.[currentLang as "fr" | "en"] ?? d.destination_code);

  const newOptions: Highcharts.Options = {
    chart: { type: "bar", height: 350 },
    legend: { enabled: true },
    xAxis: { categories },
    yAxis: {
      min: 0,
      max: 100,
      reversedStacks: false,
      title: { text: undefined },
      gridLineColor: "var(--background-default-grey-hover)",
      gridLineWidth: 0.5,
    },
    tooltip: {
      pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y}%</b> ({point.custom.count})<br/>',
      shared: false,
    },
    plotOptions: {
      bar: {
        stacking: "percent",
        borderWidth: 0,
        borderRadius: 0,
        dataLabels: {
          enabled: true,
          format: "{y}%",
          style: { fontSize: "11px", fontWeight: "normal", textOutline: "none" },
        },
      },
    },
    series: [
      {
        type: "bar",
        name: currentLang === "fr" ? "% Femmes" : "% Women",
        color: getCssColor("women-color"),
        data: sorted.map((d) => ({
          y: getPercent(d, "female"),
          custom: { count: d.genders.find((g) => g.gender === "female")?.count ?? 0 },
        })),
      },
      {
        type: "bar",
        name: currentLang === "fr" ? "% Hommes" : "% Men",
        color: getCssColor("men-color"),
        data: sorted.map((d) => ({
          y: getPercent(d, "male"),
          custom: { count: d.genders.find((g) => g.gender === "male")?.count ?? 0 },
        })),
      },
      {
        type: "bar",
        name: currentLang === "fr" ? "% Non binaire" : "% Non binary",
        color: getCssColor("unspecified-field-color"),
        data: sorted.map((d) => ({
          y: getPercent(d, "non binary"),
          custom: { count: d.genders.find((g) => g.gender === "non binary")?.count ?? 0 },
        })),
      },
    ],
  };

  return CreateChartOptions("bar", newOptions);
}
