import { formatPeriode } from "../../utils";
import { getDiametre, TAILLE_MAX } from "./utils.tsx";
import type { MatriceTextes } from "./utils.tsx";

type LegendeTaillesProps = {
  // Période des effectifs qui font la taille des bulles (période d'arrivée d'une matrice)
  periode: [number, number];
  // Trois tailles de référence fournies par le serveur
  tailles: number[];
  textes: Pick<MatriceTextes, "peuFiable" | "taille">;
};

// Légende des tailles de bulles des matrices et des nuages à quadrants
export default function LegendeTailles({ periode: annees, tailles, textes }: LegendeTaillesProps) {
  if (tailles.length === 0) return null;
  const zMin = tailles[0];
  const zMax = tailles[tailles.length - 1];
  const periode = formatPeriode(annees);

  return (
    <ul aria-label={`Taille : nombre de ${textes.taille.unite} sur ${periode}`} className="fr-text--sm fr-mb-0">
      <li className="fr-text-mention--grey">{`Taille : ${textes.taille.unite} sur ${periode}`}</li>
      {tailles.map((z) => {
        const d = getDiametre(z, zMin, zMax);
        return (
          <li key={z}>
            <svg aria-hidden="true" height={TAILLE_MAX + 2} width={d + 2}>
              <circle cx={d / 2 + 1} cy={TAILLE_MAX / 2 + 1} fill="none" r={d / 2} stroke="currentColor" strokeWidth="1" />
            </svg>
            {textes.taille.format(z)}
          </li>
        );
      })}
      <li>{`Bulle vide : ${textes.peuFiable}`}</li>
    </ul>
  );
}
