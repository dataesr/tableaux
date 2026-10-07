import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { CreateChartOptions } from "../../../../components/chart-ep";
import i18n from "./i18n.json";

// Récupérer les couleurs DSFR depuis les variables CSS
const getDSFRColors = () => {
  const rootStyles = getComputedStyle(document.documentElement);
  const colors: string[] = [];
  for (let i = 0; i <= 20; i++) {
    const color = rootStyles.getPropertyValue(`--scale-${i}-color`).trim();
    if (color) {
      colors.push(color);
    }
  }
  return colors.length > 0 ? colors : undefined;
};

export default function Options(data, currentLang = "fr") {
  if (!data) return null;

  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  const dsfrColors = getDSFRColors();

  const newOptions: HighchartsInstance.Options = {
    colors: dsfrColors,
    series: [
      {
        type: "variablepie",
        minPointSize: 10,
        innerSize: "20%",
        zMin: 0,
        name: getI18nLabel("number-of-projects"),
        borderRadius: 5,
        data: data.collaborations
          .slice(0, 20) // Limit to 20 entities
          .map((item) => {
            return {
              name: item.entities_name,
              y: item.total_collaborations,
              z: item.total_projects,
            };
          }),
        dataLabels: {
          enabled: true,
          format: "{point.name} ({point.y})",
          style: {
            fontSize: "12px",
            fontWeight: "bold",
          },
        },
        tooltip: {
          pointFormat: `<br/>Collaborations: {point.y}<br/>${getI18nLabel("total-projects")}: {point.z}`,
        },
      },
    ],
  };

  return CreateChartOptions("variablepie", newOptions);
}
