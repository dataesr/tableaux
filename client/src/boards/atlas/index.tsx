import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Container, Row, Col } from "@dataesr/dsfr-plus"

import { useTitle } from "../../hooks/usePageTitle.tsx";
import { getFiltersValues } from "../../api/atlas.ts";
import { getGeoLabel, setfavoriteIdsInCookie } from "../../utils.tsx";
import Breadcrumb from "../../components/breadcrumb"
import navigationConfig from "./navigation-config.json"
import { Search } from "./pages/search/index.tsx";
import YearsModalButton from "./components/header/years-modal-button.tsx";
import { AtlasSideMenu } from "./components/side-menu-layout/index.tsx";
import { GetLevelBadgeFromId } from "./utils/badges.tsx";
import { getLevelFromGeoId } from "./utils/index.tsx";

import "./styles.scss";

export default function AtlasHeader() {
  const [searchParams] = useSearchParams();
  const geoId = searchParams.get("geo_id") || ""

  useTitle("Tableaux - Atlas des effectifs étudiant-e-s");

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
        <Breadcrumb
          config={{
            ...navigationConfig,
            general: { label: { fr: "Chargement des filtres en cours ..." } },
          }}
        />
      </Container>
    )
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

      <Breadcrumb config={navigationConfig} section={geoId && geoLabel}/>

      {!geoId ? <Search /> : <AtlasSideMenu geoLabel={geoLabel} level={getLevelFromGeoId({ geoId })} title={geoLabelFull} />}
    </Container>
  )
}
