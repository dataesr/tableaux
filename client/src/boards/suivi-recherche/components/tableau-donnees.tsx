import type { ReactNode } from "react";

type TableauDonneesProps = {
  // Légende du tableau, lue par les lecteurs d'écran (le titre du graphique est déjà affiché au-dessus)
  caption: string;
  // En-tête et corps du tableau (<thead>, <tbody>)
  children: ReactNode;
};

// Tableau accessible d'un graphique (`renderData` de ChartWrapper) : tableau DSFR bordé et compact
export default function TableauDonnees({ caption, children }: TableauDonneesProps) {
  return (
    <div className="fr-table fr-table--bordered fr-table--sm">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">{caption}</caption>
              {children}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
