import { getDomaineColor } from "../../utils";

type LegendeDomainesProps = {
  // [code, nom] de chaque domaine ERC présent dans le graphique
  domaines: [string, string][];
};

// Légende des couleurs par domaine ERC (matrices et nuages de disciplines)
export function LegendeDomaines({ domaines }: LegendeDomainesProps) {
  return (
    <ul aria-label="Couleur : domaine ERC" className="fr-text--sm fr-mb-0">
      {domaines.map(([code, nom]) => (
        <li key={code}>
          <svg aria-hidden="true" height="14" width="14">
            <circle cx="7" cy="7" fill={getDomaineColor(code)} fillOpacity="0.5" r="6" stroke={getDomaineColor(code)} strokeWidth="1.5" />
          </svg>
          {`${nom} (${code})`}
        </li>
      ))}
    </ul>
  );
}

type LegendeEtablissementsProps = {
  // Établissement sélectionné présent dans le graphique (null : aucun)
  entiteNom: string | null;
  // Libellé du groupe des autres établissements
  groupe: string;
};

// Légende des couleurs des matrices et nuages d'établissements : l'établissement sélectionné, les autres
export function LegendeEtablissements({ entiteNom, groupe }: LegendeEtablissementsProps) {
  return (
    <ul aria-label="Couleur" className="fr-text--sm fr-mb-0">
      {entiteNom && (
        <li>
          <svg aria-hidden="true" height="14" width="14">
            <circle cx="7" cy="7" fill="var(--sr-etablissement-selectionne)" fillOpacity="0.5" r="5.5" stroke="var(--sr-etablissement-selectionne)" strokeWidth="3" />
          </svg>
          {entiteNom}
        </li>
      )}
      <li>
        <svg aria-hidden="true" height="14" width="14">
          <circle cx="7" cy="7" fill="var(--sr-etablissement)" fillOpacity="0.5" r="6" stroke="var(--sr-etablissement)" strokeWidth="1.5" />
        </svg>
        {groupe}
      </li>
    </ul>
  );
}
