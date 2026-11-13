import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options.ts";
import { getCssColor } from "../../../../../../utils/colors";
import type { NuageVivier, NuageVivierPoint } from "../../../../api/erc.ts";
import { dessinerAnnotations, ZOOM } from "../../../../components/matrice/annotations.ts";
import { TAILLE_MAX, TAILLE_MIN } from "../../../../components/matrice/utils.tsx";
import { formatPart } from "../../../../utils";
import { formatValeurVivier } from "../../vivier.ts";
import { getTextesNuage, QUADRANTS_VIVIER } from "./utils.ts";

// Ce qui distingue un nuage d'un autre (établissements, disciplines) : nom de la série, couleur, étiquette et
// en-tête de l'infobulle des points, point mis en avant
export type RenduNuage<P> = {
  couleur: (point: P) => string;
  entete: (point: P) => string[];
  // Nom court posé à côté de la bulle
  etiquette: (point: P) => string;
  focus: (point: P) => boolean;
  nomSerie: string;
};

// Quadrants, tri des bulles et bornes des axes viennent du serveur ; ici, uniquement le mapping vers Highcharts.
// Même lecture que les matrices : zoom, noms des quadrants dans les coins, étiquettes hors des bulles, bulles vides peu fiables.
export default function getNuageOptions<P extends NuageVivierPoint>(data: NuageVivier<P>, rendu: RenduNuage<P>) {
  const { bornes, points, references } = data;
  const textes = getTextesNuage(data);
  const mentionColor = getCssColor("text-mention-grey");
  const halo = `3px ${getCssColor("background-default-grey")}`;
  const style = { color: mentionColor, fontSize: "11px", textOutline: halo };

  const options: HighchartsInstance.Options = {
    chart: {
      height: 560,
      // Marge haute : le menu d'export ne recouvre pas le coin en haut à droite
      marginTop: 48,
      marginRight: 24,
      zooming: ZOOM,
      events: {
        render: function (this: any) {
          dessinerAnnotations<P>(this, {
            coins: Object.fromEntries(QUADRANTS_VIVIER.map(({ key, titre }) => [key, titre])) as Record<P["quadrant"], string>,
            // Hors du cadre : taux de succès exact dans l'étiquette
            etiquette: (p) => {
              const nom = rendu.focus(p) ? `<b>${rendu.etiquette(p)}</b>` : rendu.etiquette(p);
              return p.hors_cadre ? `${nom} (${formatPart(p.succes.valeur)})` : nom;
            },
            focus: rendu.focus,
          });
        },
      },
    },
    xAxis: {
      type: "logarithmic",
      gridLineWidth: 1,
      min: bornes.x[0] ?? undefined,
      max: bornes.x[1] ?? undefined,
      startOnTick: false,
      endOnTick: false,
      title: { text: textes.axeX },
      labels: { formatter: function () { return formatValeurVivier(Number(this.value)); } },
      plotLines: [{
        value: references.candidature.valeur ?? 0,
        color: mentionColor,
        dashStyle: "Dash",
        width: 1.5,
        zIndex: 3,
        label: {
          text: `${references.candidature.libelle} : ${formatValeurVivier(references.candidature.valeur)}`,
          rotation: 0,
          y: -4,
          x: 4,
          verticalAlign: "bottom",
          style,
        },
      }],
    },
    yAxis: {
      min: bornes.y[0],
      max: bornes.y[1],
      startOnTick: false,
      endOnTick: false,
      title: { text: textes.axeY },
      labels: { formatter: function () { return formatPart(Number(this.value)); } },
      plotLines: [{
        value: references.succes.valeur ?? 0,
        color: mentionColor,
        width: 1.5,
        zIndex: 3,
        label: {
          text: `${references.succes.libelle} : ${formatPart(references.succes.valeur)}`,
          align: "right",
          x: -4,
          y: -4,
          style,
        },
      }],
    },
    plotOptions: {
      bubble: {
        minSize: TAILLE_MIN,
        maxSize: TAILLE_MAX,
        marker: { fillOpacity: 0.5, lineWidth: 1.5 },
        // Infobulle seulement au survol d'une bulle : les zones vides restent libres pour sélectionner une zone à zoomer
        stickyTracking: false,
        dataLabels: { enabled: false },
      },
    },
    tooltip: {
      useHTML: true,
      formatter: function (this: any) {
        // Pendant la sélection d'une zone à zoomer, l'infobulle masquerait la zone visée
        if (this.series.chart.mouseIsDown) return false;
        const p = this.point.options.custom as P;
        return textes.infobulle(p, rendu.entete(p)).join("<br/>");
      },
    },
    series: [{
      type: "bubble",
      // Les points posés sur le bord du cadre restent entiers
      clip: false,
      name: rendu.nomSerie,
      data: points.map((p) => {
        const color = rendu.couleur(p);
        // Hors du cadre : posé sur le bord, en triangle pointant vers sa vraie position, taux dans l'étiquette
        const bord = p.hors_cadre === "haut" ? bornes.y[1] : p.hors_cadre === "bas" ? bornes.y[0] : null;
        return {
          x: p.candidature.valeur!,
          y: bord ?? p.succes.valeur,
          z: p.taille,
          color,
          custom: p,
          // Sous le seuil de fiabilité : bulle vide ; point mis en avant : contour épais
          marker: {
            ...(!p.fiable && { fillColor: "transparent" }),
            lineColor: color,
            ...(rendu.focus(p) && { lineWidth: 3 }),
            ...(p.hors_cadre && { symbol: p.hors_cadre === "haut" ? "triangle" : "triangle-down" }),
          },
        };
      }),
    }],
  };

  return createChartOptions("bubble", options);
}
