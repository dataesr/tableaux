import type { Ratio, Ruban } from "../../api";
import TableauDonnees from "../tableau-donnees.tsx";
import { getContinentFromCountryCode } from "../../../../utils/continents";
import { getCssColor } from "../../../../utils/colors";

// athena publie des codes ISO2, l'utilitaire des continents attend de l'ISO3
const ISO3_BY_ISO2: Record<string, string> = {
  AT: "AUT", AU: "AUS", BE: "BEL", BR: "BRA", CA: "CAN", CH: "CHE", CN: "CHN", CZ: "CZE", DE: "DEU", DK: "DNK",
  EE: "EST", EG: "EGY", ES: "ESP", FI: "FIN", FR: "FRA", GB: "GBR", GR: "GRC", HU: "HUN", ID: "IDN", IE: "IRL",
  IL: "ISR", IN: "IND", IR: "IRN", IT: "ITA", JP: "JPN", KR: "KOR", MX: "MEX", NL: "NLD", NO: "NOR", PL: "POL",
  PT: "PRT", RO: "ROU", RU: "RUS", SA: "SAU", SE: "SWE", SI: "SVN", TR: "TUR", UA: "UKR", US: "USA",
};

export function getContinent(paysCode: string): string {
  return getContinentFromCountryCode(ISO3_BY_ISO2[paysCode] ?? paysCode);
}

export function getContinentColor(continent: string): string {
  return getCssColor(`sr-continent-${continent.normalize("NFD").replace(/[̀-ͯ]/g, "")}`);
}

// Légende des rubans : pays mis en avant, puis un aplat par continent
export function LegendeRubans({ continents, focus }: { continents: string[]; focus: string }) {
  return (
    <ul className="sr-legende" aria-label="Légende">
      <li>
        <svg aria-hidden="true" height="12" width="24"><rect fill="var(--sr-france)" height="12" width="24" /></svg>
        {focus}
      </li>
      {continents.map((continent) => (
        <li key={continent}>
          <svg aria-hidden="true" height="12" width="24"><rect fill={getContinentColor(continent)} height="12" width="24" /></svg>
          {continent}
        </li>
      ))}
    </ul>
  );
}

type TableRubansProps = {
  annees: number[];
  caption: string;
  // Valeur et calcul d'une cellule : « 11,7 % (567 / 4 862 lauréats) »
  formatCellule: (ratio: Ratio & { fiable?: boolean }) => string;
  series: Ruban[];
};

// Vue tableau : valeur, calcul et rang de chaque pays, année par année
export function TableRubans({ annees, caption, formatCellule, series }: TableRubansProps) {
  return (
    <TableauDonnees caption={caption}>
      <thead>
        <tr>
          <th scope="col">Pays</th>
          {annees.map((annee) => <th key={annee} scope="col">{annee}</th>)}
        </tr>
      </thead>
      <tbody>
        {series.map((ruban) => (
          <tr key={ruban.entite_id}>
            <th scope="row">{ruban.nom}</th>
            {ruban.annees.map(({ rang, ratio }, j) => (
              <td key={annees[j]}>{ratio ? `${formatCellule(ratio)} · ${rang}ᵉ` : "—"}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </TableauDonnees>
  );
}

// Exemple de lecture (clé `readingKey` de ChartWrapper) : rang et valeur de l'entité mise en avant
// pour la dernière année où elle a une valeur, avec son calcul
export function getLectureRubans(
  annees: number[],
  series: Ruban[],
  entiteId: string,
  formatCellule: TableRubansProps["formatCellule"],
): string | null {
  const ruban = series.find(({ entite_id: id }) => id === entiteId);
  if (!ruban) return null;
  const index = ruban.annees.map(({ ratio }) => ratio !== null).lastIndexOf(true);
  if (index < 0) return null;
  const { rang, ratio } = ruban.annees[index];
  const nb = series.filter((s) => s.annees[index]?.ratio).length;
  return `En ${annees[index]}, ${ruban.nom} est au ${rang === 1 ? "1er" : `${rang}e`} rang sur ${nb} pays : ${formatCellule(ratio!)}.`;
}
