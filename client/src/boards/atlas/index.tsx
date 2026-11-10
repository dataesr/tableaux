import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Container, Row, Col, Spinner } from "@dataesr/dsfr-plus";

import { useTitle } from "../../hooks/usePageTitle.tsx";
import { getFiltersValues } from "../../api/atlas.ts";
import { getGeoLabel, setfavoriteIdsInCookie } from "../../utils.tsx";
import { Search } from "./pages/search/index.tsx";
import YearsModalButton from "./components/header/years-modal-button.tsx";
import { AtlasTabs } from "./components/tabs-layout/index.tsx";
import { GetLevelBadgeFromId } from "./utils/badges.tsx";
import { getLevelFromGeoId } from "./utils/index.tsx";
import Breadcrumb from "../../components/breadcrumb/index.tsx";

import navigationConfig from "./navigation-config.json";


import "./styles.scss";

export default function AtlasHeader() {
  const [searchParams] = useSearchParams();
  const geoId = searchParams.get("geo_id") || "";

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
        <Spinner />
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
        <Col>
          <Breadcrumb config={navigationConfig} />
        </Col>
        <Col className="text-right">
          <YearsModalButton />
        </Col>
      </Row>
      {!geoId ? <Search /> : <AtlasTabs geoLabel={geoLabel} level={getLevelFromGeoId({ geoId })} title={geoLabelFull} />}
    </Container>
  );
}
