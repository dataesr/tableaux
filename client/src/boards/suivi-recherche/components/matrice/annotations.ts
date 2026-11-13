import type { QuadrantKey } from "../../api";
import { getCssColor } from "../../../../utils/colors";

// Annotations communes aux graphiques à quadrants (matrices niveau × dynamique, nuages candidature × succès) :
// zoom, noms des quadrants dans les coins et étiquettes des bulles, recalculés à chaque rendu (positions en pixels).

type Box = { x: number; y: number; width: number; height: number };
const intersects = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

// Zoom à la souris : glisser pour sélectionner une zone, dans les deux directions
export const ZOOM = {
  type: "xy" as const,
  // En haut à gauche, au-dessus du cadre : ne recouvre ni le menu d'export ni le nom d'un quadrant
  resetButton: { relativeTo: "spacingBox" as const, position: { align: "left" as const, verticalAlign: "top" as const, x: 0, y: 8 } },
};

export type Annotations<T> = {
  // Nom de chaque quadrant, posé dans son coin
  coins: Record<QuadrantKey, string>;
  // Étiquette posée à côté d'une bulle (HTML court), à partir du point (`custom` du point Highcharts)
  etiquette: (point: T) => string;
  // Point mis en avant : son étiquette est placée en premier
  focus?: (point: T) => boolean;
};

// À appeler depuis `chart.events.render` : les points Highcharts portent leur point de données dans `custom`
export function dessinerAnnotations<T>(chart: any, { coins, etiquette, focus }: Annotations<T>) {
  const mentionColor = getCssColor("text-mention-grey");
  const titleColor = getCssColor("text-title-grey");
  const halo = `3px ${getCssColor("background-default-grey")}`;
  // Le libellé du bouton vient des options globales (en anglais) : on le traduit ici
  chart.resetZoomButton?.attr({ text: "Réinitialiser le zoom", title: "Revenir à la vue d'ensemble" });
  (chart.srElements ?? []).forEach((element) => element.destroy());
  chart.srElements = [];
  const { plotLeft: left, plotTop: top, plotWidth: width, plotHeight: height, renderer } = chart;
  const add = (element) => { chart.srElements.push(element); return element; };

  // Noms des quadrants, discrets, dans les coins
  const occupied: Box[] = [];
  const corner = (titre: string, droite: boolean, haut: boolean) => {
    const text = add(renderer
      .text(titre, droite ? left + width - 6 : left + 6, haut ? top + 14 : top + height - 6)
      .attr({ align: droite ? "right" : "left", zIndex: 2 })
      .css({ color: mentionColor, fontSize: "11px", fontStyle: "italic" })
      .add());
    // Écran étroit : un titre plus large que la moitié du graphique chevaucherait son voisin ;
    // on garde son premier mot (« Atouts »), le titre complet reste dans les tableaux des quadrants
    if (text.getBBox().width > width / 2 - 12) text.attr({ text: titre.split(",")[0] });
    occupied.push(text.getBBox());
  };
  corner(coins.hd, true, true);
  corner(coins.hg, false, true);
  corner(coins.bd, true, false);
  corner(coins.bg, false, false);

  // Une étiquette par bulle, posée hors des bulles avec un trait de rappel.
  // Recherche autour de la bulle, de plus en plus loin, en privilégiant la direction opposée au centre du nuage.
  // Après un zoom, seules les bulles restées dans le cadre sont dessinées et étiquetées
  const allPoints = (chart.series[0]?.points ?? []).filter((p) => p.isInside !== false);
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

  // Le point mis en avant, puis les grosses bulles : ils obtiennent les meilleures places
  const prioritaire = (p) => (focus?.(p.options.custom) ? 1 : 0);
  allPoints.sort((a, b) => prioritaire(b) - prioritaire(a) || b.z - a.z).forEach((p) => {
    const r = p.marker?.radius ?? 0;
    const cx = left + p.plotX;
    const cy = top + p.plotY;
    const label = add(renderer
      .text(etiquette(p.options.custom), 0, 0)
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
      chart.srElements.pop();
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
}
