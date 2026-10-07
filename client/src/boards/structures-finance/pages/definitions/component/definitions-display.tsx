import { parseMarkdown } from "../../../../../utils/format";

interface Definition {
  indicateur: string;
  libelle: string;
  definition: string;
  interpretation?: string;
  source1fr?: string | null;
  opendata1?: string | null;
  source2fr?: string | null;
  opendata2?: string | null;
  source3fr?: string | null;
  opendata3?: string | null;
  source4fr?: string | null;
  opendata4?: string | null;
  unite: string;
  pageDefinition?: boolean;
}

interface DefinitionCategory {
  rubrique: string;
  sousRubriques: {
    nom: string;
    definitions: Definition[];
    interpretation?: string;
  }[];
}

interface DefinitionsProps {
  data: DefinitionCategory[];
  className?: string;
}

export default function Definitions({
  data,
  className = "",
}: DefinitionsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="fr-alert fr-alert--info" role="status">
        <p>Aucune définition disponible pour le moment.</p>
      </div>
    );
  }

  const renderSourceLinks = (def: Definition) => {
    const sources: Array<{ label: string; link: string | null }> = [
      { label: def.source1fr || "", link: def.opendata1 || null },
      { label: def.source2fr || "", link: def.opendata2 || null },
      { label: def.source3fr || "", link: def.opendata3 || null },
      { label: def.source4fr || "", link: def.opendata4 || null },
    ].filter((source) => source.label);

    if (sources.length === 0) return null;

    return (
      <div>
        {sources.map((source, index) => (
          <div key={index} className={index > 0 ? "fr-mt-1v" : ""}>
            <strong className="fr-text--sm">{source.label}</strong>
            {source.link && (
              <>
                <br />
                <a
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link fr-link--sm"
                  title={`Données ouvertes : ${source.label} - nouvelle fenêtre`}
                >
                  Données ouvertes
                </a>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      {data.map((category, categoryIndex) => {
        const validSousRubriques = category.sousRubriques.filter(
          (sousRubrique) =>
            sousRubrique.definitions.some(
              (def) =>
                def.pageDefinition === true &&
                def.definition &&
                def.definition.trim() !== ""
            )
        );

        if (validSousRubriques.length === 0) return null;

        return (
          <div key={`category-${categoryIndex}`} className="fr-mb-8w">
            <h2 className="fr-h2 fr-mb-3w">{category.rubrique}</h2>
            {validSousRubriques.map((sousRubrique, sousIndex) => (
              <div
                key={`sous-${categoryIndex}-${sousIndex}`}
                className="fr-mb-6w"
              >
                <h3 className="fr-h4 fr-mb-2w">{sousRubrique.nom}</h3>
                <div className="fr-table fr-table--bordered fr-table--no-caption">
                  <table>
                    <caption>{sousRubrique.nom}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Indicateur</th>
                        <th scope="col">Définition</th>
                        <th scope="col">Unité</th>
                        <th scope="col" style={{ width: "25%" }}>
                          Source
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sousRubrique.definitions
                        .filter(
                          (def) =>
                            def.pageDefinition === true &&
                            def.definition &&
                            def.definition.trim() !== ""
                        )
                        .map((def, defIndex) => (
                          <tr
                            key={`def-${categoryIndex}-${sousIndex}-${defIndex}`}
                          >
                            <th scope="row">{def.libelle}</th>
                            <td>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: parseMarkdown(def.definition),
                                }}
                              />
                              {def.interpretation && (
                                <>
                                  <br />
                                  <br />
                                  <strong>Interprétation :</strong>{" "}
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: parseMarkdown(def.interpretation),
                                    }}
                                  />
                                </>
                              )}
                            </td>
                            <td className="fr-text--center">{def.unite}</td>
                            <td className="fr-text--xs">
                              {renderSourceLinks(def)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
