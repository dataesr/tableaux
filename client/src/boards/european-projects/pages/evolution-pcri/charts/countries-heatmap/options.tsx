import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
// import "highcharts/modules/heatmap";

import { CreateChartOptions } from "../../../../components/chart-ep";
import type { EvolutionDataItem } from "./types";
import i18n from "./i18n.json";

export default function Options(data: EvolutionDataItem[], currentLang: string = "fr", highlightCountryCode?: string | null) {
  if (!data || data.length === 0) return null;

  function getI18nLabel(key: string): string {
    return i18n[key]?.[currentLang] || i18n[key]?.["fr"] || key;
  }

  interface CountryFrameworkData {
    country: string;
    countryCode: string;
    framework: string;
    share: number;
    funding: number;
  }

  // Calculer les totaux par framework (country_code = ALL)
  const totalsByFramework: Record<string, number> = data
    .filter((item) => item.country_code === "ALL")
    .reduce(
      (acc, item) => {
        if (!acc[item.framework]) {
          acc[item.framework] = 0;
        }
        acc[item.framework] += item.funding || 0;
        return acc;
      },
      {} as Record<string, number>,
    );

  // Grouper les données par pays et framework
  const dataByCountryFramework: Record<string, CountryFrameworkData> = data
    .filter((item) => item.country_code !== "ALL" && item.country_code !== "UE") // Exclure "Tous pays" et "Etats membres & associés"
    .reduce(
      (acc, item) => {
        const key = `${item.country_code}_${item.framework}`;
        if (!acc[key]) {
          acc[key] = {
            country: currentLang === "fr" ? item.country_name_fr : item.country_code,
            countryCode: item.country_code,
            framework: item.framework,
            share: 0,
            funding: 0,
          };
        }
        acc[key].funding += item.funding || 0;
        return acc;
      },
      {} as Record<string, CountryFrameworkData>,
    );

  // Recalculer les parts correctement
  Object.keys(dataByCountryFramework).forEach((key) => {
    const item = dataByCountryFramework[key];
    const total = totalsByFramework[item.framework] || 1;
    item.share = (item.funding / total) * 100;
  });

  const allData = Object.values(dataByCountryFramework);

  // Calculer la part totale par pays (somme de tous les frameworks)
  const countryTotals: Record<string, number> = {};
  allData.forEach((item) => {
    if (!countryTotals[item.countryCode]) {
      countryTotals[item.countryCode] = 0;
    }
    countryTotals[item.countryCode] += item.funding;
  });

  // Trier les pays par part totale et prendre les top 15
  const top15Countries = Object.entries(countryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([code]) => code);

  // Filtrer les données pour ne garder que les top 15
  const filteredData = allData.filter((item) => top15Countries.includes(item.countryCode));

  // Créer les catégories
  const frameworkOrder = ["FP6", "FP7", "Horizon 2020", "Horizon Europe"];
  const countries = [...new Set(filteredData.map((item) => item.country))].sort((a, b) => {
    const codeA = filteredData.find((d) => d.country === a)?.countryCode || "";
    const codeB = filteredData.find((d) => d.country === b)?.countryCode || "";
    const indexA = top15Countries.indexOf(codeA);
    const indexB = top15Countries.indexOf(codeB);
    return indexA - indexB;
  });

  // Préparer les données pour la heatmap
  const heatmapData: Array<{ x: number; y: number; value: number; dataLabels?: { style?: { fontWeight?: string; textOutline?: string } } }> = [];

  filteredData.forEach((item) => {
    const x = frameworkOrder.indexOf(item.framework);
    const y = countries.indexOf(item.country);
    if (x !== -1 && y !== -1) {
      const isHighlighted = highlightCountryCode && item.countryCode === highlightCountryCode;

      heatmapData.push({
        x,
        y,
        value: item.share,
        ...(isHighlighted && {
          dataLabels: {
            style: {
              fontWeight: "bold",
              textOutline: "none",
            },
          },
        }),
      });
    }
  });

  // Trouver l'index du pays à mettre en évidence
  const highlightCountryIndex = highlightCountryCode
    ? countries.findIndex((countryName) => {
        const countryCode = filteredData.find((d) => d.country === countryName)?.countryCode;
        return countryCode === highlightCountryCode;
      })
    : -1;

  const newOptions: HighchartsInstance.Options = {
    chart: {
      type: "heatmap",
      height: 600,
      marginTop: 40,
      marginBottom: 80,
    },
    title: {
      text: undefined,
    },
    xAxis: {
      categories: frameworkOrder,
      title: {
        text: getI18nLabel("x-axis-title"),
      },
    },
    yAxis: {
      categories: countries,
      title: {
        text: getI18nLabel("y-axis-title"),
      },
      reversed: true,
      labels: {
        formatter: function () {
          const countryName = this?.value as string;
          const countryCode = filteredData.find((d) => d.country === countryName)?.countryCode;
          // Ajouter une icône flèche noire pour le pays sélectionné
          if (highlightCountryCode && countryCode === highlightCountryCode) {
            return `<span style="color: #000;">▶</span> ${countryName}`;
          }
          return countryName;
        },
        useHTML: true,
        style: {
          color: "#666666", // Couleur par défaut des labels
        },
      },
      plotLines:
        highlightCountryIndex !== -1
          ? [
              {
                color: "rgba(0, 0, 145, 0.08)", // Bleu France très transparent
                width: countries.length > 0 ? 600 / countries.length : 40, // Hauteur d'une ligne
                value: highlightCountryIndex - 0.5, // Positionner entre les lignes
                zIndex: 0,
              },
            ]
          : [],
    },
    colorAxis: {
      min: 0,
      minColor: "#FFFFFF",
      maxColor: "#0aad5c",
      labels: {
        format: "{value}%",
      },
    },
    legend: {
      align: "right",
      layout: "vertical",
      margin: 0,
      verticalAlign: "top",
      y: 25,
      symbolHeight: 280,
    },
    tooltip: {
      formatter: function () {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const point = this as any;
        return `<b>${getI18nLabel("tooltip-country")}</b>: ${countries[point.y]}<br/>
                <b>${getI18nLabel("tooltip-framework")}</b>: ${frameworkOrder[point.x]}<br/>
                <b>${getI18nLabel("tooltip-share")}</b>: ${point?.value?.toFixed(2)}%`;
      },
    },
    series: [
      {
        type: "heatmap",
        name: getI18nLabel("tooltip-share"),
        borderWidth: 1,
        data: heatmapData,
        dataLabels: {
          enabled: true,
          color: "#000000",
          formatter: function () {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const point = this as any;
            const value = point?.value as number;

            if (value > 0) {
              return `${value.toFixed(1)}%`;
            }
            return "";
          },
          style: {
            fontSize: "9px",
            fontWeight: "normal",
            textOutline: "2px contrast", // Contour blanc par défaut
          },
        },
      },
    ],
  };

  return CreateChartOptions("heatmap", newOptions);
}
