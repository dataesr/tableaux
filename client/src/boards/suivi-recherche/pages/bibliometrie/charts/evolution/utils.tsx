import type { Evolution } from "../../../../api";
import { formatPart } from "../../../../utils";

export const SERIES = [
  { key: "poids", name: "Poids", color: "sr-poids" },
  { key: "influence", name: "Influence", color: "sr-influence" },
  { key: "prestige", name: "Prestige", color: "sr-prestige" },
] as const;

// Vue tableau : les trois parts mondiales, année par année
export function renderDataTable(data: Evolution, anneesProvisoires: number[]) {
  return (
    <div className="fr-table fr-table--bordered fr-table--sm">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">Évolution annuelle des parts mondiales</caption>
              <thead>
                <tr>
                  <th scope="col">Année</th>
                  {SERIES.map(({ key, name }) => <th key={key} scope="col">{name}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.annee_publication}>
                    <th scope="row">{d.annee_publication}</th>
                    {SERIES.map(({ key }) => (
                      <td key={key}>
                        {formatPart(d[key].valeur)}
                        {key === "influence" && anneesProvisoires.includes(d.annee_publication) && " (provisoire)"}
                      </td>
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
