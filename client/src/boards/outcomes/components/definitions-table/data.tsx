import type { OutcomesDefinition } from "./index";

const SOURCE_NODE = (
    <>
        MESRE-SIES, système d'information SISE, enquêtes menées par le SIES auprès des établissements
        de l'enseignement supérieur. MEN-DEPP, systèmes d'informations SCOLARITE et SIFA, enquêtes
        menées par la DEPP auprès d'établissements du secondaire et de centres de formation
        d'apprentis (CFA).
    </>
);

export const OUTCOMES_DEFINITIONS: OutcomesDefinition[] = [
    {
        key: "champ",
        libelle: "Champ et population observée",
        definition: (
            <>
                Les néo-bacheliers inscrits en L1 en 2019 en France. L'observation s'étend sur 5 ans
                jusqu'en 2023-2024. Les inscriptions et diplomations sont issues du dispositif SISE
                (MESRE) et des systèmes d'informations SCOLARITE / SCOLEGE / CYCLADES (MEN, MESRE).
            </>
        ),
        source: SOURCE_NODE,
    },
    {
        key: "doubles_inscriptions",
        libelle: "Gestion des doubles inscriptions",
        definition: (
            <>
                Les étudiants peuvent s'inscrire dans plusieurs formations ou dans une même formation
                dans différents établissements. Seule la formation « principale » est conservée,
                c'est-à-dire celle menant au diplôme le plus élevé. Les étudiants inscrits en CPGE
                et simultanément en licence sont exclus du champ.
            </>
        ),
        source: SOURCE_NODE,
    },
    {
        key: "origine_sociale",
        libelle: "Origine sociale",
        definition: (
            <>
                L'origine sociale correspond à la PCS du responsable légal. Elle peut être :
                <ul className="fr-mt-1v fr-mb-0">
                    <li>Très favorisée : chefs d'entreprise de 10 salariés ou plus, cadres, professions intellectuelles supérieures, professeurs ;</li>
                    <li>Favorisée : professions intermédiaires (hors professeurs), retraités des catégories favorisées ;</li>
                    <li>Assez défavorisée : agriculteurs exploitants, artisans, commerçants, employés ;</li>
                    <li>Défavorisée : ouvriers, inactifs, chômeurs n'ayant jamais travaillé.</li>
                </ul>
            </>
        ),
        source: SOURCE_NODE,
    },
    {
        key: "devenir_en_un_an",
        libelle: "Devenir en un an",
        definition: (
            <>
                Situation des étudiants un an après leur première inscription en 2019 :
                <ul className="fr-mt-1v fr-mb-0">
                    <li>Passage en L2 dans la même licence ou dans une licence du même groupe disciplinaire ;</li>
                    <li>Redoublement en L1 dans la même licence ou dans une licence du même groupe disciplinaire ;</li>
                    <li>Réorientation vers d'autres formations que la licence ou vers une licence d'un autre groupe disciplinaire, avec ou sans perte de temps ;</li>
                    <li>Sortie de l'enseignement supérieur français.</li>
                </ul>
            </>
        ),
        source: SOURCE_NODE,
    },
    {
        key: "sortants",
        libelle: "Sortants de l'enseignement supérieur",
        definition: (
            <>
                Les sortants de l'enseignement supérieur peuvent soit renoncer à faire des études ou
                entrer sur le marché du travail, soit décider de poursuivre des études à l'étranger
                ou dans des formations pour lesquelles les données individuelles ne sont pas
                disponibles.
            </>
        ),
        source: SOURCE_NODE,
    },
    {
        key: "parcours_types",
        libelle: "Parcours types",
        definition: (
            <>
                Construits selon les trajectoires les plus fréquentes :
                <ul className="fr-mt-1v fr-mb-0">
                    <li>
                        <b>Parcours linéaire</b> : diplômés de la licence dans laquelle ils étaient inscrits en 2019 ou une licence du même groupe disciplinaire. Ces étudiants sont restés inscrits en licence dans la même spécialité avant l'obtention du diplôme, même avec une interruption temporaire des études.
                    </li>
                    <li>
                        <b>Réorientations accomplies</b> : réorientés et diplômés d'un autre diplôme que la licence dans laquelle ils étaient inscrits, ou valident leur diplôme de 2019 en passant par d'autres formations que la licence avant l'obtention du diplôme. Quand ces réorientés ne sont pas diplômés, ils ont au minimum atteint un niveau d'études BAC+3 en 2023-2024 (dernière année d'observation) ou avant.
                    </li>
                    <li>
                        <b>Inscriptions récurrentes sans dépasser le niveau BAC+3</b> : non-diplômés restés inscrits au moins 3 fois sur les 5 années d'observation sans dépasser le niveau BAC+3. Les trajectoires de ces étudiants sont marquées par des sorties temporaires, des redoublements et des réorientations vers d'autres formations et/ou secteurs disciplinaires.
                    </li>
                    <li>
                        <b>Inscrits moins de deux fois durant la période d'observation</b> : non-diplômés qui ne s'inscrivent pas plus de 2 fois dans l'enseignement supérieur durant la période d'observation et ne dépassent jamais le niveau BAC+2.
                    </li>
                </ul>
            </>
        ),
        source: SOURCE_NODE,
    },
];
