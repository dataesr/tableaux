import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button, TextInput } from "@dataesr/dsfr-plus";
import ResultsWithPagination from "./results";

export default function SearchEntities() {
  const [searchParams] = useSearchParams();
  const country_code = searchParams.get("country_code") || "FRA";
  const [query, setQuery] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedEntity, setSelectedEntity] = useState<{ entities_id: string; entities_name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["ep/get-entities", "pillars", query, country_code],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3000/api/european-projects/collaborations/get-entities?entityName=${query}&country_code=${country_code}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    enabled: query.length >= 3,
  });

  useEffect(() => {
    if (query.length >= 3 && !selectedEntity) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [query, selectedEntity]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setIsVisible(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // function getI18nLabel(key) {
  //   return i18n[key][currentLang];
  // }

  const selectEntity = (entity) => {
    setSelectedEntity(entity);
    setQuery(entity.entities_name);
    // setEntityId(entity.entities_id);
    setIsVisible(false);
    setSelectedIndex(-1);
  };

  const scrollSelectedIntoView = (index: number) => {
    if (index === -1) return;

    const resultsElement = resultsRef.current;
    const selectedElement = resultsElement?.querySelector(`li:nth-child(${index + 1})`);

    if (selectedElement && resultsElement) {
      const containerRect = resultsElement.getBoundingClientRect();
      const elementRect = selectedElement.getBoundingClientRect();

      if (elementRect.bottom > containerRect.bottom) {
        // Scroll vers le bas si l'élément est en dessous
        selectedElement.scrollIntoView({ block: "nearest" });
      } else if (elementRect.top < containerRect.top) {
        // Scroll vers le haut si l'élément est au-dessus
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!data || !isVisible) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex((prev) => {
          const newIndex = prev < data.length - 1 ? prev + 1 : prev;
          setTimeout(() => scrollSelectedIntoView(newIndex), 0);
          return newIndex;
        });
        break;
      case "ArrowUp":
        event.preventDefault();
        if (selectedIndex <= 0) {
          // Retour au champ de saisie
          setSelectedIndex(-1);
          inputRef.current?.focus();
        } else {
          setSelectedIndex((prev) => {
            const newIndex = prev - 1;
            setTimeout(() => scrollSelectedIntoView(newIndex), 0);
            return newIndex;
          });
        }
        break;
      case "Enter":
        if (selectedIndex >= 0) {
          const entity = data[selectedIndex];
          selectEntity(entity);
        }
        break;
      case "Escape":
        setIsVisible(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Réinitialiser l'index sélectionné quand la requête change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setCurrentPage(1);

    // Si l'utilisateur commence à taper quelque chose de différent
    // de l'entité sélectionnée, on réinitialise la sélection
    if (selectedEntity && newQuery !== selectedEntity.entities_name) {
      setSelectedEntity(null);
      // setEntityId(null);
    }
  };

  const handleResetClick = () => {
    setQuery("");
    setIsVisible(false);
    setSelectedIndex(-1);
    setSelectedEntity(null);
    setCurrentPage(1);
    // setEntityId(null);
    inputRef.current?.focus();
  };

  return (
    <section className="fr-mt-2w">
      <label className="fr-label" htmlFor="entity-search-input">
        Recherche d'une entité française
      </label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <TextInput id="entity-search-input" onChange={handleInputChange} onKeyDown={handleKeyDown} ref={inputRef} value={query} />
        </div>
        <Button icon="delete-line" size="sm" variant="secondary" onClick={handleResetClick} disabled={query.length === 0} className="fr-btn--icon-only">
          {/* {getI18nLabel("reset")} */}
          reset
        </Button>
      </div>
      <p className="fr-text--xs fr-mb-1w">Tapez au moins 3 caractères pour lancer la recherche automatiquement</p>
      <ResultsWithPagination data={data} isLoading={isLoading} currentPage={currentPage} maxResults={10} onPageChange={setCurrentPage} />

      {/* <ul>
        {data && isVisible && (
          <div ref={resultsRef}>
            {data.map((entity, index) => (
              <li
                key={entity.entities_id}
                // onClick={() => selectEntity(entity)}
              >
                <Link href="#">{entity.entities_name}</Link>
              </li>
            ))}
          </div>
        )}
      </ul>
      <nav role="navigation" className="fr-pagination" aria-label="pagination">
        <ul className="fr-pagination__list">
          <li>
            <a className="fr-pagination__link fr-pagination__link--first" title="Première page" aria-disabled="true" role="link">
              Première page
            </a>
          </li>
          <li>
            <a className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label" title="Page précédente" aria-disabled="true" role="link">
              Page précédente
            </a>
          </li>
          <li>
            <a className="fr-pagination__link" aria-current="page" title="Page 1">
              1
            </a>
          </li>
          <li>
            <a className="fr-pagination__link" href="#" title="Page 2">
              2
            </a>
          </li>

          <li>
            <span className="fr-pagination__link fr-hidden fr-unhidden-lg">…</span>
          </li>

          <li>
            <a className="fr-pagination__link fr-hidden fr-unhidden-lg" href="#" title="Page 131">
              131
            </a>
          </li>
          <li>
            <a className="fr-pagination__link" href="#" title="Page 132">
              132
            </a>
          </li>
          <li>
            <a className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label" id="pagination-6519" href="#" title="Page suivante">
              Page suivante
            </a>
          </li>
          <li>
            <a className="fr-pagination__link fr-pagination__link--last" href="#" title="Dernière page">
              Dernière page
            </a>
          </li>
        </ul>
      </nav> */}
    </section>
  );
}
