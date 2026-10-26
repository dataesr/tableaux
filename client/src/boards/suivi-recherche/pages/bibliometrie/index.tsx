import { Alert, Col, Container, Notice, Row, SegmentedControl, SegmentedElement, Title, Toggle } from "@dataesr/dsfr-plus";

import DefaultSkeleton from "../../../../components/charts-skeletons/default.tsx";
import { useBiblioDisciplines, useBiblioEntites, useBiblioIndicateurs, useBiblioMeta } from "../../api";
import type { BiblioDiscipline, BiblioMeta, BiblioOptions, Selection } from "../../api";
import { useBiblioOptions, useSelection } from "../../hooks/use-selection";
import { describeSelection } from "../../utils";
import ComparaisonInternationale from "./charts/comparaison-internationale/index.tsx";
import Evolution from "./charts/evolution/index.tsx";
import PositionnementDisciplines from "./charts/positionnement/index.tsx";
import Indicateurs from "./components/indicateurs/index.tsx";

const PERIMETRE_LABELS = {
  revues_sjr: "Revues classées par SJR",
  toutes_revues_openalex: "Toutes les revues (OpenAlex)",
};

export default function BibliometriePage() {
  const meta = useBiblioMeta();
  const disciplines = useBiblioDisciplines();
  const entites = useBiblioEntites();
  const { selection, setParams } = useSelection(meta.data);
  const options = useBiblioOptions(meta.data);

  const isLoading = meta.isLoading || disciplines.isLoading || entites.isLoading;
  const isError = meta.isError || disciplines.isError || entites.isError;
  const entiteNom = entites.data?.find((entite) => entite.entite_id === selection?.entiteId)?.nom ?? selection?.entiteId ?? "";

  return (
    <Container className="fr-my-4w">
      <Title as="h1" look="h3">Bibliométrie</Title>
      <p className="fr-text--lead">
        Poids, influence et prestige des publications scientifiques, en part de la production mondiale.
      </p>

      {isLoading && <DefaultSkeleton height="200px" label="Chargement des données" />}
      {isError && (
        <Alert
          description="Les données bibliométriques ne sont pas disponibles pour le moment. Réessayez plus tard."
          title="Erreur de chargement"
          variant="error"
        />
      )}

      {meta.data && disciplines.data && entites.data && (
        <>
          <Row gutters className="fr-mb-2w">
            <Col xs="12" md="6">
              <SegmentedControl label="Revues de référence" name="sr-perimetre">
                {meta.data.perimetres.map((perimetre) => (
                  <SegmentedElement
                    checked={options.perimetre === perimetre}
                    key={perimetre}
                    label={PERIMETRE_LABELS[perimetre] ?? perimetre}
                    onClick={() => setParams({ perimetre: perimetre === "revues_sjr" ? null : perimetre })}
                    value={perimetre}
                  />
                ))}
              </SegmentedControl>
            </Col>
            <Col xs="12" md="6">
              <Toggle
                checked={options.inclureMultidisciplinaires}
                hint={meta.data.revues_multidisciplinaires.join(", ")}
                id="sr-multidisciplinaires"
                label="Prestige : inclure les revues multidisciplinaires"
                onChange={(event) => setParams({ multi: event.target.checked ? null : "false" })}
              />
            </Col>
          </Row>

          {selection ? (
            <BibliometrieContent
              disciplines={disciplines.data}
              entiteNom={entiteNom}
              meta={meta.data}
              options={options}
              selection={selection}
            />
          ) : (
            <Notice closeMode="disallow" type="info">Choisissez un établissement dans la sélection ci-dessus.</Notice>
          )}

          {meta.data.methode.length > 0 && (
            <section className="fr-mt-6w">
              <Title as="h2" look="h5">Méthode</Title>
              <ul>
                {meta.data.methode.map((texte) => <li key={texte}>{texte}</li>)}
              </ul>
            </section>
          )}
        </>
      )}
    </Container>
  );
}

type ContentProps = {
  disciplines: BiblioDiscipline[];
  entiteNom: string;
  meta: BiblioMeta;
  options: BiblioOptions;
  selection: Selection;
};

function BibliometrieContent({ disciplines, entiteNom, meta, options, selection }: ContentProps) {
  const indicateurs = useBiblioIndicateurs(selection, options);
  const selectionLabel = describeSelection(selection, entiteNom, disciplines);
  const optionsLabel = `${PERIMETRE_LABELS[options.perimetre]} · prestige ${options.inclureMultidisciplinaires ? "avec" : "sans"} les revues multidisciplinaires`;

  return (
    <>
      {indicateurs.isLoading && <DefaultSkeleton height="160px" label="Chargement des indicateurs" />}
      {indicateurs.isError && (
        <Alert description="Les indicateurs n'ont pas pu être calculés pour cette sélection." title="Erreur de chargement" variant="error" />
      )}
      {indicateurs.data && indicateurs.data.nb_articles === 0 && (
        <Notice className="fr-mb-4w" closeMode="disallow" type="info">
          {`Aucun article pour ${selectionLabel}. Élargissez la période ou choisissez « Toutes disciplines ».`}
        </Notice>
      )}
      {indicateurs.data && indicateurs.data.nb_articles > 0 && (
        <>
          <Indicateurs data={indicateurs.data} optionsLabel={optionsLabel} selectionLabel={selectionLabel} />
          <Evolution meta={meta} options={options} selection={selection} selectionLabel={selectionLabel} />
        </>
      )}

      <section className="fr-mt-6w">
        <Title as="h2" look="h4">Comparaison internationale</Title>
        <ComparaisonInternationale disciplines={disciplines} meta={meta} options={options} selection={selection} />
      </section>

      <section className="fr-mt-6w">
        <Title as="h2" look="h4">Positionnement des disciplines : niveau × dynamique</Title>
        <PositionnementDisciplines entiteNom={entiteNom} options={options} selection={selection} />
      </section>
    </>
  );
}
