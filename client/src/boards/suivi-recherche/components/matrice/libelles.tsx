type PastilleProps = { couleur: string };

// Pastille de couleur devant le nom d'un point, dans les tableaux des quadrants (décorative : le nom suffit)
export function Pastille({ couleur }: PastilleProps) {
  return (
    <svg aria-hidden="true" className="fr-mr-1w" height="10" width="10">
      <circle cx="5" cy="5" fill={couleur} r="5" />
    </svg>
  );
}

type LibelleEtablissementProps = {
  couleur: string;
  // Établissement sélectionné : nom en gras
  focus: boolean;
  nom: string;
  sigle?: string | null;
};

// Nom d'un établissement dans les tableaux des quadrants : pastille, nom (en gras si sélectionné), sigle
export function LibelleEtablissement({ couleur, focus, nom, sigle }: LibelleEtablissementProps) {
  return (
    <>
      <Pastille couleur={couleur} />
      {focus ? <strong>{nom}</strong> : nom}
      {sigle && <span className="fr-text-mention--grey">{` ${sigle}`}</span>}
    </>
  );
}
