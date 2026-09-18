import { useEffect, useState } from "react";
import { Container } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "../../../../components/breadcrumb";
import RangeOfYears from "../../../../components/range-of-years";
import { getErcFilters } from "../../api/erc";
import { cleanUrlParams, needsUrlCleaning } from "./url-utils";
import TabsContent from "./components/TabsContent";
import navigationConfig from "../../navigation-config.json";

import "./styles.scss";

const i18n = {
  "filter-by-years": { fr: "Filtrer par années", en: "Filter by years" },
};

export default function ERC() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  // Nettoyer l'URL des paramètres non autorisés
  useEffect(() => {
    if (needsUrlCleaning(searchParams)) {
      setSearchParams(cleanUrlParams(searchParams), { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Récupérer les filtres disponibles (années) depuis la collection
  const { data: filtersData, isLoading: isLoadingFilters } = useQuery({
    queryKey: ["erc-filters"],
    queryFn: () => getErcFilters(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Années disponibles et par défaut
  const availableYears = filtersData?.years?.sort() || [];
  const defaultYears = filtersData?.yearsByFramework?.["Horizon Europe"]?.sort() || (availableYears.length > 0 ? availableYears.slice(-3) : []);

  // Ne pas afficher le filtre d'années dans l'onglet évolution
  const activeSection = searchParams.get("section") || "synthesis";
  const showYearsFilter = activeSection !== "evolution";

  const selectedYearsCount = (searchParams.get("range_of_years") || "").split("|").filter(Boolean).length;

  const [isYearsFilterOpen, setIsYearsFilterOpen] = useState(false);

  return (
    <Container as="main" fluid>
      <div className="ep-navigator-wrapper">
        <Container>
          <Breadcrumb config={navigationConfig} />
          {/* Filtre de sélection des années */}
          {showYearsFilter && !isLoadingFilters && availableYears.length > 0 && (
            <div className="fr-mt-2w years-filter-collapsible">
              <button
                type="button"
                className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm years-filter-toggle"
                onClick={() => setIsYearsFilterOpen((prev) => !prev)}
                aria-expanded={isYearsFilterOpen}
              >
                <span className={`years-filter-chevron${isYearsFilterOpen ? " open" : ""}`} aria-hidden="true" />
                {i18n["filter-by-years"][currentLang] ?? i18n["filter-by-years"].fr}
                <span className="years-filter-ratio">
                  {selectedYearsCount}/{availableYears.length}
                </span>
              </button>
              <div className={`years-filter-body${isYearsFilterOpen ? " open" : ""}`}>
                <RangeOfYears availableYears={availableYears} defaultYears={defaultYears} yearsByFramework={filtersData?.yearsByFramework} />
              </div>
            </div>
          )}
        </Container>
      </div>
      <Container>
        <TabsContent />
      </Container>
    </Container>
  );
}
