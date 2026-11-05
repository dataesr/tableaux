import type { Matrice } from "../../api";
import type { MatriceTextes } from "../../components/matrice/utils.tsx";
import { formatArticles, formatPeriode, formatRatio } from "../../utils";

// Libellés de la matrice bibliométrique : niveau = part mondiale d'articles, taille = articles
export function getBiblioMatriceTextes<P>(data: Matrice<P>): MatriceTextes {
  return {
    axeX: `Niveau : part mondiale ${formatPeriode(data.periodes.arrivee)} (échelle logarithmique)`,
    axeY: `Dynamique : évolution relative de la part depuis ${formatPeriode(data.periodes.depart)}`,
    calcul: (ratio) => formatRatio(ratio, data.indicateur),
    niveau: "Part",
    peuFiable: `moins de ${data.seuil_fiabilite} articles`,
    taille: { colonne: "Articles", format: formatArticles, unite: "articles" },
  };
}
