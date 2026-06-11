import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb, Container, Row, Col, Link } from "@dataesr/dsfr-plus";

import { useTitle } from "../../hooks/usePageTitle.tsx";
import { getFiltersValues } from "../../api/atlas.ts";
import { getGeoLabel, setfavoriteIdsInCookie } from "../../utils.tsx";
import { Search } from "./pages/search/index.tsx";
import YearsModalButton from "./components/header/years-modal-button.tsx";
import { AtlasSideMenu } from "./components/side-menu-layout/index.tsx";
import { GetLevelBadgeFromId } from "./utils/badges.tsx";
import { getLevelFromGeoId } from "./utils/index.tsx";

import "./styles.scss";

export default function AtlasHeader() {
  const [searchParams] = useSearchParams();
  const geoId = searchParams.get("geo_id") || "";
  const isdatasupr = searchParams.get("datasupr") === "true";


  useTitle("dataSupR - Atlas des effectifs étudiant-e-s");

  useEffect(() => {
    if (searchParams.get("geo_id")) {
      setfavoriteIdsInCookie(searchParams.get("geo_id") || "");
    }
  }, [searchParams]);

  const { data: filtersValues, isLoading: isLoadingFiltersValues } = useQuery({
    queryKey: ["atlas/get-filters-values", geoId],
    queryFn: () => getFiltersValues(geoId),
  });




  if (isLoadingFiltersValues) {
    return (
      <Container as="main">
        <Breadcrumb>
          {isdatasupr && <Link href="/">Accueil</Link>}
          <Link href="/atlas">Atlas des effectifs étudiant-e-s</Link>
          <Link>Chargement des filtres en cours ...</Link>
        </Breadcrumb>
      </Container>
    );
  }

  const geoLabel = getGeoLabel(geoId, filtersValues?.geo_id);
  const geoLabelFull = (
    <>
      {geoLabel}
      {GetLevelBadgeFromId({ id: geoId })}
    </>
  );

  return (
    <Container as="main">
      <Row>
        <Col style={{ textAlign: "right" }}>
          <YearsModalButton />
        </Col>
      </Row>

      <Breadcrumb>
        {isdatasupr && <Link href={`/${isdatasupr ? "?datasupr" : ""}`}>Accueil</Link>}
        <Link href={`/atlas${isdatasupr ? "?datasupr" : ""}`}>{isdatasupr ? "Atlas des effectifs étudiant-e-s" : "Accueil"}</Link>
        {geoId && <Link>{geoLabel}</Link>}
      </Breadcrumb>

      {!geoId ? <Search /> : <AtlasSideMenu geoLabel={geoLabel} level={getLevelFromGeoId({ geoId })} title={geoLabelFull} />}
    </Container>
  );
}
