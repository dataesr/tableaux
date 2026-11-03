import { Alert, Notice, Title } from "@dataesr/dsfr-plus";

import DefaultSkeleton from "../../../../../components/charts-skeletons/default.tsx";
import { useBiblioIndicateurs } from "../../../api";
import ChartBusy from "../../../components/chart-busy/index.tsx";
import { describeSelection } from "../../../utils";
import Evolution from "../charts/evolution/index.tsx";
import PositionnementDisciplines from "../charts/positionnement/index.tsx";
import Indicateurs from "../components/indicateurs/index.tsx";
import { getOptionsLabel, useBibliometrie } from "../context.ts";

// « Où en est l'établissement sélectionné ? » : chiffres clés, évolution annuelle, forces et faiblesses par discipline
export default function ProfilPage() {
  const { disciplines, entiteNom, meta, options, selection } = useBibliometrie();
  const indicateurs = useBiblioIndicateurs(selection, options);
  const selectionLabel = describeSelection(selection, entiteNom, disciplines);
  const optionsLabel = getOptionsLabel(options);

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
          <ChartBusy busy={indicateurs.isPlaceholderData}>
            <Indicateurs data={indicateurs.data} optionsLabel={optionsLabel} selectionLabel={selectionLabel} />
          </ChartBusy>
          <Evolution meta={meta} options={options} selection={selection} selectionLabel={selectionLabel} />
        </>
      )}

      <section className="fr-mt-6w">
        <Title as="h2" look="h4">Positionnement des disciplines : niveau × dynamique</Title>
        <PositionnementDisciplines entiteNom={entiteNom} options={options} selection={selection} />
      </section>
    </>
  );
}
