import type { Positionnement, PositionnementPoint } from "../../../../api";
import { getCssColor } from "../../../../../../utils/colors";
import { formatArticles, formatDynamique, formatPart, formatPeriode, formatRatio } from "../../../../utils";

export const SEUIL_FIABILITE = 30;

// Diamètres des bulles en px ; la taille suit l'aire (sizeBy « area », le défaut de Highcharts)
export const TAILLE_MIN = 8;
export const TAILLE_MAX = 36;

export const QUADRANTS = [
  { key: "hd", titre: "Atouts en progression", definition: "Part au-dessus de la référence et en progression." },
  { key: "hg", titre: "Rattrapage", definition: "Part sous la référence, mais en progression." },
  { key: "bd", titre: "Atouts en recul", definition: "Part au-dessus de la référence, mais en recul." },
  { key: "bg", titre: "Fragilités qui s'accentuent", definition: "Part sous la référence et en recul." },
] as const;

export type QuadrantKey = (typeof QUADRANTS)[number]["key"];

// Un point est représentable si sa part d'arrivée est > 0 (échelle log) et sa dynamique calculable
export function isPlottable(point: PositionnementPoint) {
  return (point.niveau.valeur ?? 0) > 0 && point.dynamique !== null;
}

export function getQuadrant(point: PositionnementPoint, reference: number): QuadrantKey {
  const haut = (point.dynamique ?? 0) >= 0;
  const droite = (point.niveau.valeur ?? 0) >= reference;
  return `${haut ? "h" : "b"}${droite ? "d" : "g"}` as QuadrantKey;
}

export function getDomaineColor(domaineCode: string): string {
  return getCssColor(`sr-domaine-${domaineCode.toLowerCase()}`);
}

// Diamètre d'une bulle, calculé comme Highcharts, pour la légende des tailles
export function getDiametre(z: number, zMin: number, zMax: number): number {
  const position = zMax > zMin ? Math.sqrt((z - zMin) / (zMax - zMin)) : 1;
  return TAILLE_MIN + position * (TAILLE_MAX - TAILLE_MIN);
}

// Nom court : premier segment du nom du panel ERC (nom complet au survol et dans le tableau)
export function getNomCourt(nom: string, max = 26): string {
  const segment = nom.split(/[:,]/)[0].trim();
  if (segment.length <= max) return segment;
  // Coupe au dernier mot entier, sans laisser un « and » ou un « of » en fin de libellé
  const words = segment.slice(0, max).split(" ").slice(0, -1);
  while (words.length > 1 && /^(and|of|the|in|for|its)$/i.test(words[words.length - 1])) words.pop();
  return `${words.join(" ")}…`;
}

type Box = { x: number; y: number; width: number; height: number };
const intersects = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

export function getOptions(data: Positionnement) {
  const { indicateur, periodes, points, reference } = data;
  // Grosses bulles d'abord : les petites, dessinées ensuite, restent visibles par-dessus
  const plottable = points.filter(isPlottable).sort((a, b) => b.nb_articles - a.nb_articles);
  const referenceX = (reference.valeur ?? 0) * 100;
  const mentionColor = getCssColor("text-mention-grey");
  const titleColor = getCssColor("text-title-grey");
  const halo = `3px ${getCssColor("background-default-grey")}`;

  // Cadre ajusté aux données (plus la référence), avec une petite marge, au lieu des arrondis automatiques
  const xs = [referenceX, ...plottable.map((p) => p.niveau.valeur! * 100)];
  const ys = [0, ...plottable.map((p) => p.dynamique!)];
  const margeY = (Math.max(...ys) - Math.min(...ys)) * 0.08 || 1;

  return {
    chart: {
      type: "bubble",
      height: 560,
      // Marge haute : le menu d'export ne recouvre pas le coin « Atouts en progression »
      marginTop: 48,
      marginRight: 24,
      events: {
        render: function (this: any) {
          (this.srElements ?? []).forEach((element) => element.destroy());
          this.srElements = [];
          const { plotLeft: left, plotTop: top, plotWidth: width, plotHeight: height, renderer } = this;
          const add = (element) => { this.srElements.push(element); return element; };

          // Noms des quadrants, discrets, dans les coins
          const occupied: Box[] = [];
          const corner = (titre: string, droite: boolean, haut: boolean) => {
            const text = add(renderer
              .text(titre, droite ? left + width - 6 : left + 6, haut ? top + 14 : top + height - 6)
              .attr({ align: droite ? "right" : "left", zIndex: 2 })
              .css({ color: mentionColor, fontSize: "11px", fontStyle: "italic" })
              .add());
            occupied.push(text.getBBox());
          };
          corner(QUADRANTS[0].titre, true, true);
          corner(QUADRANTS[1].titre, false, true);
          corner(QUADRANTS[2].titre, true, false);
          corner(QUADRANTS[3].titre, false, false);

          // Une étiquette par bulle, « CODE Nom court », posée hors des bulles avec un trait de rappel.
          // Recherche autour de la bulle, de plus en plus loin, en privilégiant la direction opposée au centre du nuage.
          const allPoints = [...(this.series[0]?.points ?? [])];
          const circles = allPoints.map((p) => ({ cx: left + p.plotX, cy: top + p.plotY, r: p.marker?.radius ?? 0 }));
          const hitsCircle = (b: Box) => circles.some(({ cx, cy, r }) => {
            const nx = Math.max(b.x, Math.min(cx, b.x + b.width));
            const ny = Math.max(b.y, Math.min(cy, b.y + b.height));
            return (nx - cx) ** 2 + (ny - cy) ** 2 < (r + 2) ** 2;
          });
          const inside = (b: Box) => b.x >= left + 2 && b.y >= top + 2 && b.x + b.width <= left + width - 2 && b.y + b.height <= top + height - 2;
          const centreX = circles.reduce((total, c) => total + c.cx, 0) / (circles.length || 1);
          const centreY = circles.reduce((total, c) => total + c.cy, 0) / (circles.length || 1);
          const DISTANCES = [6, 14, 26, 42, 62, 88, 120, 160];
          const ANGLES = Array.from({ length: 16 }, (_, i) => (i * Math.PI) / 8);

          // Les grosses bulles d'abord : elles obtiennent les meilleures places
          allPoints.sort((a, b) => b.z - a.z).forEach((p) => {
            const r = p.marker?.radius ?? 0;
            const cx = left + p.plotX;
            const cy = top + p.plotY;
            const { discipline_code: code, discipline_nom: nom } = p.options.custom;
            const label = add(renderer
              .text(`<b>${code}</b> ${getNomCourt(nom)}`, 0, 0)
              .css({ color: titleColor, fontSize: "11px", textOutline: halo })
              .attr({ zIndex: 6 })
              .add());
            const { width: w, height: h } = label.getBBox();
            const dehors = Math.atan2(cy - centreY, cx - centreX);
            const angles = [...ANGLES].sort((a, b) => Math.abs(Math.cos(a - dehors) - 1) - Math.abs(Math.cos(b - dehors) - 1));

            let place: Box | null = null;
            for (const distance of DISTANCES) {
              for (const angle of angles) {
                const ax = cx + Math.cos(angle) * (r + distance);
                const ay = cy + Math.sin(angle) * (r + distance);
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const box = {
                  x: cos > 0.35 ? ax : cos < -0.35 ? ax - w : ax - w / 2,
                  y: sin > 0.35 ? ay : sin < -0.35 ? ay - h : ay - h / 2,
                  width: w,
                  height: h,
                };
                if (inside(box) && !hitsCircle(box) && !occupied.some((o) => intersects(o, box))) {
                  place = box;
                  break;
                }
              }
              if (place) break;
            }
            if (!place) {
              label.destroy();
              this.srElements.pop();
              return;
            }
            label.attr({ x: place.x, y: place.y + h * 0.75 });
            occupied.push(place);
            // Trait du bord de la bulle au point le plus proche de l'étiquette
            const tx = Math.max(place.x, Math.min(cx, place.x + place.width));
            const ty = Math.max(place.y, Math.min(cy, place.y + place.height));
            const angle = Math.atan2(ty - cy, tx - cx);
            if (Math.hypot(tx - cx, ty - cy) - r > 4) {
              add(renderer
                .path(["M", cx + r * Math.cos(angle), cy + r * Math.sin(angle), "L", tx, ty])
                .attr({ stroke: mentionColor, "stroke-width": 1, zIndex: 5 })
                .add());
            }
          });
        },
      },
    },
    credits: { enabled: false },
    title: { text: "" },
    legend: { enabled: false },
    xAxis: {
      type: "logarithmic",
      gridLineWidth: 1,
      min: Math.min(...xs) / 1.3,
      max: Math.max(...xs) * 1.3,
      startOnTick: false,
      endOnTick: false,
      title: { text: `Niveau : part mondiale ${formatPeriode(periodes.arrivee)} (échelle logarithmique)` },
      labels: { formatter: function (this: any) { return formatPart(this.value / 100); } },
      plotLines: [{
        value: referenceX,
        color: mentionColor,
        dashStyle: "Dash",
        width: 1.5,
        zIndex: 3,
        label: { text: formatPart(reference.valeur), rotation: 0, y: -4, x: 4, verticalAlign: "bottom", style: { color: mentionColor, fontSize: "11px" } },
      }],
    },
    yAxis: {
      min: Math.min(...ys) - margeY,
      max: Math.max(...ys) + margeY,
      startOnTick: false,
      endOnTick: false,
      title: { text: `Dynamique : évolution relative de la part depuis ${formatPeriode(periodes.depart)}` },
      labels: { formatter: function (this: any) { return formatDynamique(this.value); } },
      plotLines: [{ value: 0, color: mentionColor, width: 1.5, zIndex: 3 }],
    },
    plotOptions: {
      bubble: {
        minSize: TAILLE_MIN,
        maxSize: TAILLE_MAX,
        marker: { fillOpacity: 0.5, lineWidth: 1.5 },
        // Pas d'étiquette au centre des bulles : elles sont posées à l'extérieur (événement render)
        dataLabels: { enabled: false },
      },
    },
    tooltip: {
      useHTML: true,
      formatter: function (this: any) {
        const p: PositionnementPoint = this.point.options.custom;
        const quadrant = QUADRANTS.find(({ key }) => key === getQuadrant(p, reference.valeur ?? 0));
        return [
          `<b>${p.discipline_code} · ${p.discipline_nom}</b>`,
          `${p.domaine_nom} · <i>${quadrant?.titre}</i>`,
          `Part ${formatPeriode(periodes.arrivee)} : <b>${formatPart(p.niveau.valeur)}</b> = ${formatRatio(p.niveau, indicateur)}`,
          `Part ${formatPeriode(periodes.depart)} : ${formatPart(p.niveau_depart.valeur)} = ${formatRatio(p.niveau_depart, indicateur)}`,
          `Évolution relative : <b>${formatDynamique(p.dynamique)}</b>`,
          `Taille : ${formatArticles(p.nb_articles)} articles sur ${formatPeriode(periodes.arrivee)}${p.nb_articles < SEUIL_FIABILITE ? " (peu fiable)" : ""}`,
        ].join("<br/>");
      },
    },
    series: [{
      name: "Disciplines",
      data: plottable.map((p) => {
        const color = getDomaineColor(p.domaine_code);
        return {
          x: p.niveau.valeur! * 100,
          y: p.dynamique,
          z: p.nb_articles,
          name: p.discipline_code,
          color,
          custom: p,
          labelrank: p.nb_articles,
          // Moins de 30 articles : bulle vide, la position est peu fiable
          ...(p.nb_articles < SEUIL_FIABILITE && { marker: { fillColor: "transparent", lineColor: color } }),
        };
      }),
    }],
  };
}
