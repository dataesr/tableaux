import { Alert, Col, Row, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { useMemo, useState } from "react";

import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options.ts";
import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { getCssColor } from "../../../../../../utils/colors";
import type { Selection } from "../../../../api";
import { usePrixEvolution } from "../../../../api/prix.ts";
import type { PrixEvolution, PrixMeta } from "../../../../api/prix.ts";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import { getChartSources } from "../../../../components/sources.tsx";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import { ENTITE_NATIONALE } from "../../../../hooks/use-selection";
import { formatNombre, formatPart } from "../../../../utils";
import { formatNonClasses, formatPartTotal } from "../../prix.ts";

type Vue = "nombre" | "part";
const VUES: { key: Vue; label: string }[] = [
  { key: "nombre", label: "Nominations" },
  { key: "part", label: "Part du total" },
];
// Une couleur par prix d'un groupe (juniors / seniors, bronze / argent / or / innovation)
const COULEURS = ["sr-poids", "sr-influence", "sr-prestige", "sr-etablissement"];

type Annee = PrixEvolution["annees"][number];

const categorie = (d: Annee) => (d.provisoire ? `${d.annee} (provisoire)` : String(d.annee));

// Nominations empilées par prix, ou part du total France de l'établissement (avec son calcul dans l'infobulle)
function getOptions(annees: Annee[], vue: Vue, entiteNom: string) {
  const options: HighchartsInstance.Options = vue === "nombre"
    ? {
      chart: { height: 400 },
      legend: { enabled: true },
      xAxis: { categories: annees.map(categorie), title: { text: "Année d'attribution" } },
      yAxis: { min: 0, allowDecimals: false, title: { text: "Nominations" }, stackLabels: { enabled: false } },
      plotOptions: { column: { stacking: "normal" } },
      tooltip: {
        shared: true,
        formatter: function () {
          const lignes = (this.points ?? []).map((point) => `<span style="color:${point.color}">●</span> ${point.series.name} : <b>${formatNombre(point.y ?? 0)}</b>`);
          const total = (this.points ?? []).reduce((s, point) => s + (point.y ?? 0), 0);
          return [`<b>${this.key}</b>`, ...lignes, `Total : <b>${formatNombre(total)}</b>`].join("<br/>");
        },
      },
      series: (annees[0]?.par_prix ?? []).map(({ libelle }, index) => ({
        type: "column",
        name: libelle,
        color: getCssColor(COULEURS[index % COULEURS.length]),
        data: annees.map((d) => d.par_prix[index].nb_laureats),
      })),
    }
    : {
      chart: { height: 400 },
      legend: { enabled: false },
      xAxis: { categories: annees.map(categorie), title: { text: "Année d'attribution" } },
      yAxis: { min: 0, title: { text: "Part des nominations françaises" }, labels: { formatter: function () { return formatPart(Number(this.value)); } } },
      tooltip: {
        formatter: function () {
          const { texte } = (this as unknown as HighchartsInstance.Point).options.custom ?? {};
          return `<b>${this.key}</b><br/>${entiteNom} : <b>${texte}</b>`;
        },
      },
      series: [{
        type: "line",
        name: entiteNom,
        color: getCssColor("sr-etablissement-selectionne"),
        data: annees.map((d) => ({ y: d.part?.valeur ?? null, custom: { texte: d.part ? formatPartTotal(d.part) : "—" } })),
      }],
    };
  return createChartOptions(vue === "nombre" ? "column" : "line", options);
}

// Exemple de lecture : dernière année complète (sinon la dernière), nominations par prix et, en vue part, part du total
function getLecture(annees: Annee[], vue: Vue, entiteNom: string): string | null {
  const completes = annees.filter((d) => !d.provisoire);
  const retenues = completes.length > 0 ? completes : annees;
  const d = retenues[retenues.length - 1];
  if (!d) return null;
  const detail = d.par_prix.map(({ libelle, nb_laureats: nb }) => `${libelle} : ${formatNombre(nb)}`).join(" · ");
  const part = vue === "part" && d.part ? `, soit ${formatPartTotal(d.part)}` : "";
  return `En ${d.annee}, ${entiteNom} compte ${formatNombre(d.nb_laureats)} nomination${d.nb_laureats > 1 ? "s" : ""}${part} (${detail}).`;
}

function renderTable(annees: Annee[], vue: Vue, caption: string) {
  const prix = annees[0]?.par_prix ?? [];
  return (
    <div className="fr-table fr-table--bordered fr-table--sm">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">{caption}</caption>
              <thead>
                <tr>
                  <th scope="col">Année d'attribution</th>
                  {prix.map(({ prix_id: id, libelle }) => <th key={id} scope="col">{libelle}</th>)}
                  <th scope="col">Total</th>
                  {vue === "part" && <th scope="col">Part du total France</th>}
                </tr>
              </thead>
              <tbody>
                {annees.map((d) => (
                  <tr key={d.annee}>
                    <th scope="row">{categorie(d)}</th>
                    {d.par_prix.map(({ prix_id: id, nb_laureats: nb }) => <td key={id}>{formatNombre(nb)}</td>)}
                    <td>{formatNombre(d.nb_laureats)}</td>
                    {vue === "part" && <td>{d.part ? formatPartTotal(d.part) : "—"}</td>}
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

type PrixEvolutionProps = {
  entiteNom: string;
  meta: PrixMeta;
  selection: Selection;
  selectionLabel: string;
};

// « Combien de nominations, année par année ? » : un groupe de prix à la fois (IUF, médailles du CNRS)
export default function PrixEvolutionChart({ entiteNom, meta, selection, selectionLabel }: PrixEvolutionProps) {
  const [distinction, setDistinction] = useState(meta.groupe_defaut);
  const [choixVue, setVue] = useState<Vue>("nombre");
  // La France est le total : pas de part du total
  const etablissement = selection.entiteId !== ENTITE_NATIONALE;
  const vue = etablissement ? choixVue : "nombre";
  const { data, isError, isLoading, isPlaceholderData } = usePrixEvolution(selection, distinction);
  const demande = useMemo(() => (data ? { data, vue } : null), [data, vue]);
  const { applied, busy } = useRenderTransition(demande);
  const chartOptions = useMemo(
    () => (applied?.data.periode ? getOptions(applied.data.annees, applied.vue, entiteNom) : null),
    [applied, entiteNom],
  );

  const controles = (
    <Row gutters>
      <Col xs="12" md="6">
        <SegmentedControl className="fr-segmented--sm fr-mb-2w" label="Distinction" name="sr-prix-evolution-distinction">
          {meta.groupes.map(({ code, libelle }) => (
            <SegmentedElement checked={distinction === code} key={code} label={libelle} onClick={() => setDistinction(code)} value={code} />
          ))}
        </SegmentedControl>
      </Col>
      {etablissement && (
        <Col xs="12" md="6">
          <SegmentedControl className="fr-segmented--sm fr-mb-2w" label="Indicateur" name="sr-prix-evolution-vue">
            {VUES.map(({ key, label }) => (
              <SegmentedElement checked={vue === key} key={key} label={label} onClick={() => setVue(key)} value={key} />
            ))}
          </SegmentedControl>
        </Col>
      )}
    </Row>
  );

  if (isError) return <Alert description="L'évolution des nominations n'a pas pu être chargée." title="Erreur de chargement" variant="error" />;
  if (isLoading || !applied) return <DefaultSkeleton />;
  if (!applied.data.periode || !chartOptions) {
    return <p className="fr-text--sm">Aucune année de prix dans la période choisie.</p>;
  }

  const groupe = meta.groupes.find(({ code }) => code === applied.data.distinction)?.libelle ?? "";
  const titre = `${applied.vue === "part" ? "Part du total des nominations" : "Nominations"} par année · ${groupe} · ${selectionLabel}`;
  const provisoires = applied.data.annees.filter((d) => d.provisoire).map((d) => d.annee);
  const nonClasses = formatNonClasses(applied.data.non_classes);
  const lecture = getLecture(applied.data.annees, applied.vue, entiteNom);

  return (
    <>
      {controles}
      <ChartBusy busy={isPlaceholderData || busy}>
        <ChartWrapper
          config={{
            id: "suivi-recherche-financements-prix-evolution",
            title: { fr: titre, look: "h5" as const },
            comment: {
              fr: (
                <>
                  {"Nominations par année d'attribution du prix. Une personne nommée deux fois (membre junior puis senior) compte deux fois. "}
                  {applied.vue === "part"
                    ? "Part du total : nominations de l'établissement / nominations françaises. Un lauréat compte pour toutes ses tutelles : les parts ne s'additionnent pas. "
                    : "Le nombre de nominations est fixé chaque année par l'organisme qui décerne le prix. "}
                  {nonClasses && `${nonClasses} `}
                  {provisoires.length > 0 && `${provisoires.join(", ")} : année en cours, prix pas tous recensés.`}
                </>
              ),
            },
            ...(lecture && { readingKey: { fr: <>{lecture}</> } }),
            sources: getChartSources(meta.sources),
          }}
          options={chartOptions}
          renderData={() => renderTable(applied.data.annees, applied.vue, titre)}
        />
      </ChartBusy>
    </>
  );
}
