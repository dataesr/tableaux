import { ReactNode, useEffect, useState } from "react";
import { Container, Row, Col, Title, Alert, Button } from "@dataesr/dsfr-plus";
import { Outlet, useLocation, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Source from "../source";

import "./styles.scss";
import { DEFAULT_CURRENT_YEAR } from "../../../../constants";
import { getFiltersValues, getParentsFromGeoId } from "../../../../api";
import { getParentFromLevel } from "../../../../utils";

export function AtlasSideMenu({
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
  const isdatasupr = searchParams.get("datasupr") === "true";
  const navigate = useNavigate();

  const [showAlertMessage, setShowAlertMessage] = useState(false);

  const { data: filtersValues } = useQuery({
    queryKey: ["atlas/get-filters-values", geoId],
    queryFn: () => getFiltersValues(geoId),
  });

    const { data: dataParents, isLoading: isLoadingParents } = useQuery({
      queryKey: ["atlas/get-parents-from-geoId", geoId],
      queryFn: () => getParentsFromGeoId(geoId),
    });

    let parent;
    if (!isLoadingParents) {
      parent = getParentFromLevel(dataParents, geoId);
    }

  useEffect(() => {
    document.title = `${geoLabel} (${level}) - Atlas des effectifs étudiant-e-s ${currentYear}`;
  }, [geoLabel, level, currentYear]);

  useEffect(() => {
    setShowAlertMessage(
      !filtersValues?.annees_universitaires?.onlyWithData.includes(currentYear)
    );
  }, [currentYear, filtersValues]);

  if (!pathname) return null;

  const filtersParams = searchParams.toString();
  const is = (str: string): boolean => pathname?.startsWith(str);

  return (
    <Container>
      <Row>
        <Col xs={12} md={3}>
          <nav className="fr-sidemenu" role="navigation" aria-labelledby="sidemenu-title" style={{ height: "100%" }}>
            <div className="fr-sidemenu__inner" style={{ height: "100%" }}>
              <button aria-expanded="false" aria-controls="sidemenu-collapse-2" type="button" className="fr-sidemenu__btn">
                navigation
              </button>
              <div className="fr-collapse" id="sidemenu-collapse-2">
                <p className="fr-sidemenu__title" id="sidemenu-title">
                  Menu de navigation
                </p>
                {geoId && (
                  <Button icon="home-4-line" onClick={() => navigate(`/atlas${isdatasupr ? "?datasupr" : ""}`)} size="sm">
                    Revenir à la page de sélection des territoires
                  </Button>
                )}

                <br />

                {geoId && !isLoadingParents && dataParents && parent && (
                  <Button className="fr-mt-1w" icon="arrow-up-line" onClick={() => navigate(`/atlas/general?geo_id=${parent.geo_id}&annee_universitaire=${currentYear}${isdatasupr ? "&datasupr" : ""}`)} size="sm">
                    Revenir au territoire parent ({parent.geo_nom})
                  </Button>
                )}

                <ul className="fr-sidemenu__list">
                  <li className="fr-sidemenu__item">
                    <Link aria-current={is("/atlas/general") && "page"} to={`/atlas/general?${filtersParams}`} className="fr-sidemenu__link">
                      En un coup d'oeil
                    </Link>
                  </li>
                  <li className="fr-sidemenu__item">
                    <Link aria-current={is("/atlas/effectifs-par-filiere") && "page"} to={`/atlas/effectifs-par-filiere?${filtersParams}`} className="fr-sidemenu__link">
                      Effectifs par filière
                    </Link>
                  </li>
                  <li className="fr-sidemenu__item">
                    <Link aria-current={is("/atlas/effectifs-par-secteur") && "page"} to={`/atlas/effectifs-par-secteur?${filtersParams}`} className="fr-sidemenu__link">
                      Effectifs par secteur
                    </Link>
                  </li>
                  <li className="fr-sidemenu__item">
                    <Link aria-current={is("/atlas/effectifs-par-genre") && "page"} to={`/atlas/effectifs-par-genre?${filtersParams}`} className="fr-sidemenu__link">
                      Effectifs par genre
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </Col>
        <Col xs={12} md={9} className="fr-mb-5w">
          <Title as="h1" look="h3" className="fr-mb-5w">
            <span className="fr-icon-map-pin-2-line fr-mr-1w" aria-hidden="true" />
            {title}
          </Title>
          {showAlertMessage && <Alert className="fr-mb-3w" description="Aucune donnée n'est disponible pour l'année universitaire sélectionnée. Veuillez sélectionner une autre année." title="Alerte" variant="error" />}
          <Outlet />
          <Source />
        </Col>
      </Row>
    </Container>
  );
}
