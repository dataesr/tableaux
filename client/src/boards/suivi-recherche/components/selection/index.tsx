import { Container, SegmentedControl, SegmentedElement, Select, SelectOption } from "@dataesr/dsfr-plus";
import { useEffect, useId, useMemo, useState } from "react";

import { useBiblioDisciplines, useBiblioEntites, useBiblioMeta } from "../../api";
import type { Entite } from "../../api";
import { useSelection } from "../../hooks/use-selection";

import "./styles.scss";

function optionLabel(entite: Entite) {
  return [entite.nom, entite.sigle && `(${entite.sigle})`, entite.ville && `· ${entite.ville}`].filter(Boolean).join(" ");
}

// Sélection commune aux onglets : périmètre d'analyse, période, discipline
export default function SelectionBar() {
  const meta = useBiblioMeta();
  const disciplines = useBiblioDisciplines();
  const entites = useBiblioEntites();
  const { niveau, etablissementId, selection, setParams } = useSelection(meta.data);
  const datalistId = useId();
  const inputId = useId();

  const etablissements = useMemo(
    () => (entites.data ?? []).filter((entite) => entite.entite_type === "etablissement"),
    [entites.data],
  );
  const selected = etablissements.find((entite) => entite.entite_id === etablissementId);
  const [saisie, setSaisie] = useState("");
  useEffect(() => setSaisie(selected ? optionLabel(selected) : ""), [selected]);

  const domaines = useMemo(
    () => [...new Map((disciplines.data ?? []).map((d) => [d.domaine_code, d.domaine_nom])).entries()],
    [disciplines.data],
  );

  if (!meta.data || !disciplines.data || !entites.data) return null;

  // Le champ natif propose les établissements ; seul un libellé exact de la liste vaut sélection
  const onSaisie = (value: string) => {
    setSaisie(value);
    const match = etablissements.find((entite) => optionLabel(entite) === value);
    if (match) setParams({ entite: match.entite_id });
  };

  const disciplineKey = selection?.disciplineCode
    ? `discipline:${selection.disciplineCode}`
    : selection?.domaineCode ? `domaine:${selection.domaineCode}` : "toutes";

  return (
    <div className="sr-selection">
      <Container>
        <div className="sr-selection__grid">
          <SegmentedControl className="fr-segmented--sm" label="Périmètre d'analyse" name="sr-niveau">
            <SegmentedElement
              checked={niveau === "national"}
              label="France"
              onClick={() => setParams({ niveau: null })}
              value="national"
            />
            <SegmentedElement
              checked={niveau === "etablissement"}
              label="Un établissement"
              onClick={() => setParams({ niveau: "etablissement" })}
              value="etablissement"
            />
          </SegmentedControl>
          {/* Toujours présent (désactivé au niveau national) : les champs suivants ne bougent pas */}
          <div className="fr-input-group">
            <label className="fr-label" htmlFor={inputId}>Établissement</label>
            <input
              autoComplete="off"
              className="fr-input"
              disabled={niveau !== "etablissement"}
              id={inputId}
              list={datalistId}
              onChange={(event) => onSaisie(event.target.value)}
              placeholder={niveau === "etablissement" ? `Nom, sigle ou ville (${etablissements.length} établissements)` : "Choisir « Un établissement »"}
              type="search"
              value={niveau === "etablissement" ? saisie : ""}
            />
            <datalist id={datalistId}>
              {etablissements.map((entite) => <option key={entite.entite_id} value={optionLabel(entite)} />)}
            </datalist>
          </div>
          <Select
            label="De"
            onSelectionChange={(key) => setParams({ debut: String(key) })}
            selectedKey={selection ? String(selection.anneeDebut) : undefined}
          >
            {meta.data.annees.map((annee) => <SelectOption key={String(annee)}>{String(annee)}</SelectOption>)}
          </Select>
          <Select
            label="À"
            onSelectionChange={(key) => setParams({ fin: String(key) })}
            selectedKey={selection ? String(selection.anneeFin) : undefined}
          >
            {meta.data.annees.map((annee) => <SelectOption key={String(annee)}>{String(annee)}</SelectOption>)}
          </Select>
          <Select
            label="Discipline (panels ERC)"
            onSelectionChange={(key) => {
              const [type, code] = String(key).split(":");
              setParams({ domaine: type === "domaine" ? code : null, discipline: type === "discipline" ? code : null });
            }}
            selectedKey={disciplineKey}
          >
            {[
              <SelectOption key="toutes">Toutes disciplines</SelectOption>,
              ...domaines.map(([code, nom]) => <SelectOption key={`domaine:${code}`}>{`${nom} (${code})`}</SelectOption>),
              ...disciplines.data.map((d) => (
                <SelectOption key={`discipline:${d.discipline_code}`}>{`${d.discipline_code} · ${d.discipline_nom}`}</SelectOption>
              )),
            ]}
          </Select>
        </div>
      </Container>
    </div>
  );
}
