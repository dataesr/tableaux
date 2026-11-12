import { Alert, Badge, Notice } from "@dataesr/dsfr-plus";

import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useBiblioRevuesTete, type BiblioDiscipline, type BiblioMeta, type BiblioOptions, type RevueTete, type Selection } from "../../../../api";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import { getDisciplineLabel } from "../../../../utils";

const SCIMAGO_URL = "https://www.scimagojr.com";

function formatSjr(sjr: number | null): string {
  return sjr === null ? "—" : sjr.toLocaleString("fr-FR", { maximumFractionDigits: 3 });
}

function Disciplines({ revue }: { revue: RevueTete }) {
  return (
    <ul className="fr-raw-list">
      {revue.disciplines.map(({ code, nom }) => <li key={code}>{`${code} · ${nom}`}</li>)}
      {revue.multidisciplinaire && <li>Toutes les disciplines sélectionnées (revue multidisciplinaire)</li>}
    </ul>
  );
}

type RevuesTeteProps = {
  disciplines: BiblioDiscipline[];
  meta: BiblioMeta;
  options: BiblioOptions;
  selection: Selection;
};

// Les revues de tête réellement comptées dans le prestige de la sélection (disciplines et option multidisciplinaire)
export default function RevuesTete({ disciplines, meta, options, selection }: RevuesTeteProps) {
  const revues = useBiblioRevuesTete(selection, options);
  // Une seule discipline : la colonne des disciplines n'apprend rien
  const avecDisciplines = !selection.disciplineCode;

  if (revues.isLoading) return <DefaultSkeleton height="200px" label="Chargement des revues de tête" />;
  if (revues.isError) {
    return <Alert description="La liste des revues de tête n'est pas disponible pour le moment." title="Erreur de chargement" variant="error" />;
  }
  if (!revues.data) return null;

  return (
    <>
      <p className="fr-text--sm">
        {`Pour chaque discipline, les ${meta.nb_revues_tete} revues au SJR le plus élevé parmi celles dont une part suffisante des articles relève de la discipline (hors revues de synthèse)`}
        {options.inclureMultidisciplinaires ? ", plus les revues multidisciplinaires, communes à toutes les disciplines. " : ". "}
        {"Un article ne compte que s'il paraît dans une revue de tête de sa propre discipline. La liste est la même quel que soit le périmètre de référence."}
      </p>
      <ChartBusy busy={revues.isPlaceholderData}>
        {revues.data.length === 0 ? (
          <Notice closeMode="disallow" type="info">{`Aucune revue de tête pour ${getDisciplineLabel(selection, disciplines)}.`}</Notice>
        ) : (
          <div className="fr-table fr-table--bordered fr-table--sm fr-mb-0">
            <div className="fr-table__wrapper">
              <div className="fr-table__container">
                <div className="fr-table__content">
                  <table>
                    <caption>
                      {`${revues.data.length.toLocaleString("fr-FR")} revues de tête · ${getDisciplineLabel(selection, disciplines)}, par SJR décroissant`}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Revue</th>
                        <th scope="col">SJR</th>
                        {avecDisciplines && <th scope="col">Revue de tête de</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {revues.data.map((revue) => (
                        <tr key={revue.sjr_id}>
                          <th scope="row">
                            <a
                              className="fr-link fr-text--sm"
                              href={`${SCIMAGO_URL}/journalsearch.php?q=${revue.sjr_id}&tip=sid`}
                              rel="noopener noreferrer"
                              target="_blank"
                              title={`${revue.titre} sur SCImago - nouvelle fenêtre`}
                            >
                              {revue.titre}
                            </a>
                            {revue.multidisciplinaire && (
                              <Badge className="fr-ml-1w" noIcon size="sm" variant="info">Multidisciplinaire</Badge>
                            )}
                          </th>
                          <td>{formatSjr(revue.sjr)}</td>
                          {avecDisciplines && <td><Disciplines revue={revue} /></td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </ChartBusy>
      <p className="fr-text--xs fr-text-mention--grey fr-mt-1w fr-mb-0">
        {"Score SJR : "}
        <a href={SCIMAGO_URL} rel="noopener noreferrer" target="_blank" title="SCImago Journal Rank - nouvelle fenêtre">SCImago Journal Rank</a>
        {". Chaque titre mène à la fiche de la revue sur SCImago."}
      </p>
    </>
  );
}
