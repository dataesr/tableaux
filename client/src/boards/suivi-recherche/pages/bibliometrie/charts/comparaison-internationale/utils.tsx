import type { Comparaison, Indicateur } from "../../../../api";
import { getContinentFromCountryCode } from "../../../../../../utils/continents";
import { getCssColor } from "../../../../../../utils/colors";
import { formatPart, INDICATEUR_LABELS } from "../../../../utils";

// athena publie des codes ISO2, l'utilitaire des continents attend de l'ISO3
const ISO3_BY_ISO2: Record<string, string> = {
  AU: "AUS", BR: "BRA", CA: "CAN", CH: "CHE", CN: "CHN", DE: "DEU", EG: "EGY", ES: "ESP", FR: "FRA",
  GB: "GBR", ID: "IDN", IN: "IND", IR: "IRN", IT: "ITA", JP: "JPN", KR: "KOR", MX: "MEX", NL: "NLD",
  PL: "POL", RU: "RUS", SA: "SAU", SE: "SWE", TR: "TUR", UA: "UKR", US: "USA",
};

export function getContinent(paysCode: string): string {
  return getContinentFromCountryCode(ISO3_BY_ISO2[paysCode] ?? paysCode);
}

export function getContinentColor(continent: string): string {
  return getCssColor(`sr-continent-${continent.normalize("NFD").replace(/[̀-ͯ]/g, "")}`);
}

// Vue tableau : rang et part de chaque pays, année par année, pour l'indicateur affiché
export function renderDataTable(data: Comparaison, indicateur: Indicateur) {
  const { series } = data.indicateurs[indicateur];
  return (
    <div className="fr-table fr-table--bordered fr-table--sm">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">{`${INDICATEUR_LABELS[indicateur]} : part mondiale et rang des pays chaque année`}</caption>
              <thead>
                <tr>
                  <th scope="col">Pays</th>
                  {data.annees.map((annee) => <th key={annee} scope="col">{annee}</th>)}
                </tr>
              </thead>
              <tbody>
                {series.map((ruban) => (
                  <tr key={ruban.entite_id}>
                    <th scope="row">{ruban.nom}</th>
                    {ruban.annees.map(({ rang, ratio }, j) => (
                      <td key={data.annees[j]}>{`${formatPart(ratio?.valeur ?? null)} (${rang}ᵉ)`}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
