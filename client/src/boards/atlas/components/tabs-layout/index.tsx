import { ReactNode, useEffect, useState } from "react";
import { Container, Title, Alert, Button } from "@dataesr/dsfr-plus";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Source from "../source";

import { DEFAULT_CURRENT_YEAR } from "../../../../constants";
import { getFiltersValues, getParentsFromGeoId } from "../../../../api";
import { getParentFromLevel } from "../../../../utils";

const tabs = [
  { id: "general", label: "En un coup d'œil", path: "/atlas/general" },
  { id: "fields", label: "Effectifs par filière", path: "/atlas/effectifs-par-filiere" },
  { id: "sectors", label: "Effectifs par secteur", path: "/atlas/effectifs-par-secteur" },
  { id: "genders", label: "Effectifs par genre", path: "/atlas/effectifs-par-genre" },
] as const;

export function AtlasTabs({
  geoLabel,
  level,
  title,
}: {
  geoLabel: string;
  level: string;
  title: ReactNode;
}) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const currentYear =
    searchParams.get("annee_universitaire") || DEFAULT_CURRENT_YEAR;
  const geoId = searchParams.get("geo_id") || "";
  const shared: boolean = searchParams.has("shared");
  const navigate = useNavigate();
  const activeTab = tabs.find(({ path }) => pathname.startsWith(path))?.id;

  const [showAlertMessage, setShowAlertMessage] = useState(false);

  const { data: filtersValues } = useQuery({
    queryKey: ["atlas/get-filters-values", geoId],
    queryFn: () => getFiltersValues(geoId),
  });

  const { data: dataParents, isLoading: isLoadingParents } = useQuery({
    queryKey: ["atlas/get-parents-from-geoId", geoId],
    queryFn: () => getParentsFromGeoId(geoId),
  });

  const parent = !isLoadingParents
    ? getParentFromLevel(dataParents, geoId)
    : undefined;

  useEffect(() => {
    document.title = `${geoLabel} (${level}) - Atlas des effectifs étudiant-e-s ${currentYear}`;
  }, [geoLabel, level, currentYear]);

  useEffect(() => {
    setShowAlertMessage(
      !filtersValues?.annees_universitaires?.onlyWithData.includes(currentYear)
    );
  }, [currentYear, filtersValues]);

  if (!pathname) return null;

  const handleTabChange = (tab: (typeof tabs)[number]) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("section");
    navigate({ pathname: tab.path, search: newParams.toString() });
  };

  return (
    <Container>
      <Title as="h1" look="h3" className="fr-mb-3w">
        <span className="fr-icon-map-pin-2-line fr-mr-1w" aria-hidden="true" />
        {title}
      </Title>
      <div className="fr-mb-3w">
        {geoId && (
          <Button icon="home-4-line" onClick={() => navigate(`/atlas${shared ? "?shared" : ""}`)} size="sm" variant="secondary">
            Revenir à la page de sélection des territoires
          </Button>
        )}
        {geoId && dataParents && parent && (
          <Button className="fr-ml-1w" icon="arrow-up-line" onClick={() => navigate(`/atlas/general?geo_id=${parent.geo_id}&annee_universitaire=${currentYear}${shared ? "&shared" : ""}`)} size="sm" variant="secondary">
            Revenir au territoire parent ({parent.geo_nom})
          </Button>
        )}
      </div>
      <nav className="fr-nav" aria-label="Navigation des sections">
        <ul className="fr-nav__list">
          {tabs.map((tab) => (
            <li className="fr-nav__item" key={tab.id}>
              <button className="fr-nav__link" onClick={() => handleTabChange(tab)} aria-current={activeTab === tab.id ? "page" : undefined}>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {showAlertMessage && <Alert className="fr-mb-3w" description="Aucune donnée n'est disponible pour l'année universitaire sélectionnée. Veuillez sélectionner une autre année." title="Alerte" variant="error" />}
      <div className="fr-mt-3w">
        <Outlet />
        <Source />
      </div>
    </Container>
  );
}
