import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";
interface EffectifsData {
  effectif_sans_cpge?: number;
  effectif_sans_cpge_l?: number;
  effectif_sans_cpge_m?: number;
  effectif_sans_cpge_d?: number;
  effectif_sans_cpge_dn?: number;
  effectif_sans_cpge_du?: number;
  effectif_sans_cpge_deg0?: number;
  effectif_sans_cpge_deg1?: number;
  effectif_sans_cpge_deg2?: number;
  effectif_sans_cpge_deg3?: number;
  effectif_sans_cpge_deg4?: number;
  effectif_sans_cpge_deg5?: number;
  effectif_sans_cpge_deg6?: number;
  effectif_sans_cpge_deg9?: number;
  part_effectif_sans_cpge_l?: number;
  part_effectif_sans_cpge_m?: number;
  part_effectif_sans_cpge_d?: number;
  effectif_sans_cpge_iut?: number;
  effectif_sans_cpge_ing?: number;
  effectif_sans_cpge_dsa?: number;
  effectif_sans_cpge_llsh?: number;
  effectif_sans_cpge_theo?: number;
  effectif_sans_cpge_si?: number;
  effectif_sans_cpge_staps?: number;
  effectif_sans_cpge_sante?: number;
  effectif_sans_cpge_veto?: number;
  effectif_sans_cpge_interd?: number;
  part_effectif_sans_cpge_iut?: number;
  part_effectif_sans_cpge_ing?: number;
  part_effectif_sans_cpge_dsa?: number;
  part_effectif_sans_cpge_llsh?: number;
  part_effectif_sans_cpge_theo?: number;
  part_effectif_sans_cpge_si?: number;
  part_effectif_sans_cpge_staps?: number;
  part_effectif_sans_cpge_sante?: number;
  part_effectif_sans_cpge_veto?: number;
  part_effectif_sans_cpge_interd?: number;
  has_effectif_l?: boolean;
  has_effectif_m?: boolean;
  has_effectif_d?: boolean;
  has_effectif_iut?: boolean;
  has_effectif_ing?: boolean;
  has_effectif_dsa?: boolean;
  has_effectif_llsh?: boolean;
  has_effectif_theo?: boolean;
  has_effectif_si?: boolean;
  has_effectif_staps?: boolean;
  has_effectif_sante?: boolean;
  has_effectif_veto?: boolean;
  has_effectif_interd?: boolean;
  emploi_etpt?: number;
  taux_encadrement?: number;
}

export const createEffectifsNiveauChartOptions = (
  data: EffectifsData
): Highcharts.Options => {
  const niveaux = [
    {
      name: "1er cycle (cursus L)",
      y: data.effectif_sans_cpge_l || 0,
      color: getCssColor("scale-randomized-0-color"),
      percentage: data.part_effectif_sans_cpge_l || 0,
      has: data.has_effectif_l,
    },
    {
      name: "2ème cycle (cursus M)",
      y: data.effectif_sans_cpge_m || 0,
      color: getCssColor("scale-2"),
      percentage: data.part_effectif_sans_cpge_m || 0,
      has: data.has_effectif_m,
    },
    {
      name: "3ème cycle (cursus D)",
      y: data.effectif_sans_cpge_d || 0,
      color: getCssColor("scale-3"),
      percentage: data.part_effectif_sans_cpge_d || 0,
      has: data.has_effectif_d,
    },
  ].filter((item) => item.has);

  return createChartOptions("pie", {
    chart: {
      height: 400,
    },
    legend: {
      enabled: true,
      layout: "horizontal",
      align: "center",
      verticalAlign: "bottom",
      itemStyle: {
        color: "var(--text-default-grey)",
      },
    },
    tooltip: {
      formatter: function () {
        const point = this as any;
        return `<strong>${point.name}</strong><br/>${Highcharts.numberFormat(point.y, 0, ",", " ")} étudiants<br/>${point.percentage.toFixed(1)}% du total`;
      },
    },
    plotOptions: {
      pie: {
        size: 200,
        center: ["50%", 90],
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: false,
        },
        showInLegend: true,
      },
    },
    series: [
      {
        name: "",
        type: "pie",
        data: niveaux,
      },
    ],
  });
};

export const createEffectifsSpecifiquesChartOptions = (
  data: EffectifsData
): Highcharts.Options => {
  const specifiques = [
    {
      name: "Formations d'IUT",
      y: data.effectif_sans_cpge_iut || 0,
      percentage: data.part_effectif_sans_cpge_iut || 0,
      has: data.has_effectif_iut,
      color: getCssColor("scale-randomized-0-color"),
    },
    {
      name: "Formations d'ingénieurs",
      y: data.effectif_sans_cpge_ing || 0,
      percentage: data.part_effectif_sans_cpge_ing || 0,
      has: data.has_effectif_ing,
      color: getCssColor("scale-2"),
    },
    {
      name: "Formation de santé",
      y: data.effectif_sans_cpge_sante || 0,
      percentage: data.part_effectif_sans_cpge_sante || 0,
      has: data.has_effectif_sante,
      color: getCssColor("scale-3"),
    },
  ].filter((item) => item.has && item.y > 0);

  const categories = specifiques.map((item) => item.name);
  const values = specifiques.map((item) => ({
    y: item.y,
    color: item.color,
    name: item.name,
    percentage: item.percentage,
  }));

  return createChartOptions("column", {
    chart: {
      height: 300,
    },
    xAxis: {
      categories: categories,
      crosshair: true,
      labels: {
        align: "center",
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: "",
      },
    },
    tooltip: {
      formatter: function () {
        const point = this as any;
        return `<strong>${point.name}</strong><br/>${Highcharts.numberFormat(point.y, 0, ",", " ")} étudiants<br/>${point.percentage.toFixed(1)}% du total`;
      },
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0,
        groupPadding: 0.1,
        pointWidth: 40,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return Highcharts.numberFormat(this.y as number, 0, ",", " ");
          },
          style: {
            color: "var(--text-default-grey)",
            fontSize: "13px",
            fontWeight: "bold",
          },
        },
      },
    },
    series: [
      {
        name: "Effectifs",
        type: "column",
        data: values,
        colorByPoint: true,
        showInLegend: false,
      },
    ],
  });
};

export const createEffectifsDisciplinesChartOptions = (
  data: EffectifsData
): Highcharts.Options => {
  const disciplines = [
    {
      name: "Droit, sciences économiques, AES",
      y: data.effectif_sans_cpge_dsa || 0,
      percentage: data.part_effectif_sans_cpge_dsa || 0,
      has: data.has_effectif_dsa,
      color: getCssColor("scale-randomized-0-color"),
    },
    {
      name: "Lettres, langues et sciences humaines",
      y: data.effectif_sans_cpge_llsh || 0,
      percentage: data.part_effectif_sans_cpge_llsh || 0,
      has: data.has_effectif_llsh,
      color: getCssColor("scale-2"),
    },
    {
      name: "Théologie",
      y: data.effectif_sans_cpge_theo || 0,
      percentage: data.part_effectif_sans_cpge_theo || 0,
      has: data.has_effectif_theo,
      color: getCssColor("scale-3"),
    },
    {
      name: "Sciences et sciences de l'ingénieur",
      y: data.effectif_sans_cpge_si || 0,
      percentage: data.part_effectif_sans_cpge_si || 0,
      has: data.has_effectif_si,
      color: getCssColor("scale-4"),
    },
    {
      name: "STAPS",
      y: data.effectif_sans_cpge_staps || 0,
      percentage: data.part_effectif_sans_cpge_staps || 0,
      has: data.has_effectif_staps,
      color: getCssColor("scale-5"),
    },
    {
      name: "Santé",
      y: data.effectif_sans_cpge_sante || 0,
      percentage: data.part_effectif_sans_cpge_sante || 0,
      has: data.has_effectif_sante,
      color: getCssColor("scale-6"),
    },
    {
      name: "Vétérinaire",
      y: data.effectif_sans_cpge_veto || 0,
      percentage: data.part_effectif_sans_cpge_veto || 0,
      has: data.has_effectif_veto,
      color: getCssColor("scale-7"),
    },
    {
      name: "Interdisciplinaire",
      y: data.effectif_sans_cpge_interd || 0,
      percentage: data.part_effectif_sans_cpge_interd || 0,
      has: data.has_effectif_interd,
      color: getCssColor("scale-8"),
    },
  ].filter((item) => item.has && item.y > 0);

  return createChartOptions("pie", {
    chart: {
      height: 400,
    },
    legend: {
      enabled: true,
      layout: "horizontal",
      align: "center",
      verticalAlign: "bottom",
      itemStyle: {
        color: "var(--text-default-grey)",
      },
    },
    tooltip: {
      formatter: function () {
        const point = this as any;
        return `<strong>${point.name}</strong><br/>${Highcharts.numberFormat(point.y, 0, ",", " ")} étudiants<br/>${point.percentage.toFixed(1)}% du total`;
      },
    },
    plotOptions: {
      pie: {
        size: 200,
        center: ["50%", 90],
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: false,
        },
        showInLegend: true,
      },
    },
    series: [
      {
        name: "",
        type: "pie",
        data: disciplines,
      },
    ],
  });
};

export const createEffectifsDegreesChartOptions = (
  data: EffectifsData
): Highcharts.Options => {
  const degrees = [
    {
      name: "BAC ou inférieur",
      y: data.effectif_sans_cpge_deg0 || 0,
      color: getCssColor("scale-randomized-0-color"),
    },
    {
      name: "BAC + 1",
      y: data.effectif_sans_cpge_deg1 || 0,
      color: getCssColor("scale-2"),
    },
    {
      name: "BAC + 2",
      y: data.effectif_sans_cpge_deg2 || 0,
      color: getCssColor("scale-3"),
    },
    {
      name: "BAC + 3",
      y: data.effectif_sans_cpge_deg3 || 0,
      color: getCssColor("scale-4"),
    },
    {
      name: "BAC + 4",
      y: data.effectif_sans_cpge_deg4 || 0,
      color: getCssColor("scale-5"),
    },
    {
      name: "BAC + 5",
      y: data.effectif_sans_cpge_deg5 || 0,
      color: getCssColor("scale-6"),
    },
    {
      name: "BAC + 6 et plus",
      y: data.effectif_sans_cpge_deg6 || 0,
      color: getCssColor("scale-7"),
    },
    {
      name: "Non renseigné",
      y: data.effectif_sans_cpge_deg9 || 0,
      color: getCssColor("scale-8"),
    },
  ].filter((item) => item.y > 0);

  const total = degrees.reduce((sum, item) => sum + item.y, 0);

  const categories = degrees.map((item) => item.name);
  const values = degrees.map((item) => ({
    y: item.y,
    color: item.color,
    name: item.name,
    percentage: total > 0 ? (item.y / total) * 100 : 0,
  }));

  return createChartOptions("column", {
    chart: {
      height: 380,
      marginBottom: 100,
      marginLeft: 70,
    },
    xAxis: {
      categories: categories,
      crosshair: true,
      labels: {
        rotation: -45,
        align: "right",
        style: {
          fontSize: "11px",
        },
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: "",
      },
    },
    tooltip: {
      formatter: function () {
        const point = this as any;
        return `<strong>${point.name}</strong><br/>${Highcharts.numberFormat(point.y, 0, ",", " ")} étudiants<br/>${point.percentage.toFixed(1)}% du total`;
      },
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0,
        groupPadding: 0.1,
        pointWidth: 40,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return Highcharts.numberFormat(this.y as number, 0, ",", " ");
          },
          style: {
            color: "var(--text-default-grey)",
            fontSize: "13px",
            fontWeight: "bold",
          },
        },
      },
    },
    series: [
      {
        name: "Effectifs",
        type: "column",
        data: values,
        colorByPoint: true,
        showInLegend: false,
      },
    ],
  });
};
