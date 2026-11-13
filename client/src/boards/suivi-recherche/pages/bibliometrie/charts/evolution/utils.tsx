import type { Evolution } from "../../../../api";
import TableauDonnees from "../../../../components/tableau-donnees.tsx";
import { formatPart, formatRatio } from "../../../../utils";

export const SERIES = [
  { key: "poids", name: "Poids", color: "sr-poids" },
  { key: "influence", name: "Influence", color: "sr-influence" },
  { key: "prestige", name: "Prestige", color: "sr-prestige" },
] as const;

// Exemple de lecture : le poids de la dernière année publiée, avec son calcul
export function getLecture(data: Evolution, entiteNom: string): string | null {
  const publiees = data.filter((d) => d.poids.valeur !== null);
  const derniere = publiees[publiees.length - 1];
  if (!derniere) return null;
  return `En ${derniere.annee_publication}, ${entiteNom} signe ${formatPart(derniere.poids.valeur)} des articles mondiaux `
    + `(${formatRatio(derniere.poids, "poids")}).`;
}

// Vue tableau : les trois parts mondiales, année par année
export function renderDataTable(data: Evolution, anneesProvisoires: number[]) {
  return (
    <TableauDonnees caption="Évolution annuelle des parts mondiales">
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
                {`${formatPart(d[key].valeur)} (${formatRatio(d[key], key)})`}
                {key === "influence" && anneesProvisoires.includes(d.annee_publication) && " (provisoire)"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </TableauDonnees>
  );
}
