import { Container, SegmentedControl, SegmentedElement, Select, SelectOption } from "@dataesr/dsfr-plus";
import { useEffect, useId, useMemo, useState } from "react";

import { useBiblioDisciplines, useBiblioEntites, useBiblioMeta } from "../../api";
import type { Entite } from "../../api";
import { useSelection } from "../../hooks/use-selection";

import "./styles.scss";

function optionLabel(entite: Entite) {
  return [entite.nom, entite.sigle && `(${entite.sigle})`, entite.ville && `· ${entite.ville}`].filter(Boolean).join(" ");
}

// Sélection commune aux pages : périmètre d'analyse, période, discipline (paramètres d'URL, voir use-selection).
// `pays` : la vue compare des pays ; le choix d'établissement, sans effet, est remplacé par une mention fixe.
export default function SelectionBar({ pays = false }: { pays?: boolean }) {
  const meta = useBiblioMeta();
  const disciplines = useBiblioDisciplines();
  const entites = useBiblioEntites();
  const { etablissement, selection, setParams } = useSelection(meta.data, entites.data, { pays });
  // « Un établissement » choisi sans établissement encore saisi : état local, rien dans l'URL (ror_id absent = France)
  const [choixEtablissement, setChoixEtablissement] = useState(false);
  const niveau = etablissement || choixEtablissement ? "etablissement" : "national";
  const datalistId = useId();
  const inputId = useId();

  const etablissements = useMemo(
    () => (entites.data ?? []).filter((entite) => entite.entite_type === "etablissement"),
    [entites.data],
  );
  const [saisie, setSaisie] = useState("");
  useEffect(() => setSaisie(etablissement ? optionLabel(etablissement) : ""), [etablissement]);

  const domaines = useMemo(
    () => [...new Map((disciplines.data ?? []).map((d) => [d.domaine_code, d.domaine_nom])).entries()],
    [disciplines.data],
  );

  if (!meta.data || !disciplines.data || !entites.data) return null;

  // Le champ natif propose les établissements ; seul un libellé exact de la liste vaut sélection
  const onSaisie = (value: string) => {
    setSaisie(value);
    const match = etablissements.find((entite) => optionLabel(entite) === value);
    if (match) setParams({ ror_id: match.entite_id });
  };

  // Bornes par défaut de la période : jamais écrites dans l'URL
  const premiere = Math.min(...meta.data.annees);
  const derniere = Math.max(...meta.data.annees);

  const disciplineKey = selection?.disciplineCode
    ? `discipline:${selection.disciplineCode}`
    : selection?.domaineCode ? `domaine:${selection.domaineCode}` : "toutes";

  return (
    <div className="sr-selection fr-background-alt--grey fr-py-3v">
      <Container>
        <div className="sr-selection__grid">
          {pays ? (
            <div className="sr-selection__fixe">
              <p className="fr-label">Périmètre d'analyse</p>
              <p className="fr-mb-0">
                <strong>Pays</strong>
                <span className="fr-text-mention--grey">{" · France mise en avant ; le choix d'établissement ne s'applique pas ici"}</span>
              </p>
            </div>
          ) : (
            <>
              <SegmentedControl className="fr-segmented--sm" label="Périmètre d'analyse" name="sr-niveau">
                <SegmentedElement
                  checked={niveau === "national"}
                  label="France"
                  onClick={() => {
                    setChoixEtablissement(false);
                    setParams({ ror_id: null });
                  }}
                  value="national"
                />
                <SegmentedElement
                  checked={niveau === "etablissement"}
                  label="Un établissement"
                  onClick={() => setChoixEtablissement(true)}
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
            </>
          )}
          <Select
            label="De"
            onChange={(key) => setParams({ year_min: Number(key) === premiere ? null : String(key) })}
            value={selection ? String(selection.anneeDebut) : undefined}
          >
            {[...meta.data.annees].sort((a, b) => b - a).map((annee) => <SelectOption key={String(annee)}>{String(annee)}</SelectOption>)}
          </Select>
          <Select
            label="À"
            onChange={(key) => setParams({ year_max: Number(key) === derniere ? null : String(key) })}
            value={selection ? String(selection.anneeFin) : undefined}
          >
            {[...meta.data.annees].sort((a, b) => b - a).map((annee) => <SelectOption key={String(annee)}>{String(annee)}</SelectOption>)}
          </Select>
          <Select
            label="Discipline (panels ERC)"
            onChange={(key) => {
              const [type, code] = String(key).split(":");
              setParams({ domaine: type === "domaine" ? code : null, discipline: type === "discipline" ? code : null });
            }}
            value={disciplineKey}
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
