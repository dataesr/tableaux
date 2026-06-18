import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Col,
  Container,
  Row,
  Text,
  Title,
} from "@dataesr/dsfr-plus";
import * as turf from "@turf/turf";

import GendersCard from "../../../../components/cards/genders-card/index.tsx";
import MapSkeleton from "../../charts/skeletons/map.tsx";
import MapWithPolygonAndBubbles from "../../charts/map-with-polygon-and-bubbles.tsx";
import SectorsCard from "../../../../components/cards/sectors-card/index.tsx";
import StudentsCard from "../../../../components/cards/students-card/index.tsx";
import { DataByYear, MapBubbleDataProps } from "../../../../types/atlas.ts";
import ColumnsChart from "../../charts/columns.tsx";
import {
  getNumberOfStudentsByYear,
  getNumberOfStudents,
  getGeoPolygon,
  getNumberOfStudentsByFieldAndSublevel,
} from "../../../../api/atlas.ts";

import { useAtlas } from "../../useAtlas.tsx";

export default function OneField() {
  const { DEFAULT_CURRENT_YEAR } = useAtlas();
  const { idFiliere } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const retParams = [...searchParams]
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const params = retParams + `&regroupement=${idFiliere}`;
  const geoId = searchParams.get("geo_id") || "";
  const currentYear =
    searchParams.get("annee_universitaire") || DEFAULT_CURRENT_YEAR;

  const { data: dataByYear, isLoading: isLoadingByYear } = useQuery({
    queryKey: ["atlas/number-of-students-by-year", params],
    queryFn: () => getNumberOfStudentsByYear(params),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["atlas/number-of-students", params],
    queryFn: () => getNumberOfStudents(params),
  });

  const { data: polygonsData, isLoading: isLoadingPolygons } = useQuery({
    queryKey: ["atlas/get-geo-polygons", geoId],
    queryFn: () => getGeoPolygon(geoId),
  });

  const { data: fieldData, isLoading: isLoadingfield } = useQuery({
    queryKey: ["atlas/get-number-of-students-by-field-and-sublevel", geoId],
    queryFn: () =>
      getNumberOfStudentsByFieldAndSublevel(geoId, currentYear, idFiliere),
  });

  if (isLoading || isLoadingByYear) {
    return <div>Loading...</div>;
  }

  function Map() {
    if (
      isLoadingPolygons ||
      !polygonsData ||
      !polygonsData.length ||
      isLoadingfield ||
      !fieldData ||
      !fieldData.length
    ) {
      return <MapSkeleton />;
    }

    const mapbubbleData: MapBubbleDataProps = [];
    fieldData.forEach((item) => {
      const polygon =
        polygonsData.find((d) => d.originalId === item.id)?.geometry || null;
      if (polygon !== "undefined" && polygon !== null) {
        const calculateCenter = turf.centerOfMass(polygon);
        mapbubbleData.push({
          z: item.effectif_total || 0,
          name: item.nom,
          lat: calculateCenter.geometry.coordinates[1],
          lon: calculateCenter.geometry.coordinates[0],
        });
      }
    });

    return (
      <MapWithPolygonAndBubbles
        currentYear={currentYear}
        isLoading={false}
        mapbubbleData={mapbubbleData}
        polygonsData={polygonsData}
      />
    );
  }

  const effectifPU =
    dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)
      ?.effectif_pu || 0;
  const effectifPR =
    dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)
      ?.effectif_pr || 0;
  const pctPU = Math.round((effectifPU / (effectifPU + effectifPR)) * 1000) / 10;
  const pctPR = Math.round((effectifPR / (effectifPU + effectifPR)) * 1000) / 10;

  const effectifM =
    dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)
      ?.effectif_masculin || 0;
  const effectifF =
    dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)
      ?.effectif_feminin || 0;
  const pctM = Math.round((effectifM / (effectifM + effectifF)) * 1000) / 10;
  const pctF = Math.round((effectifF / (effectifM + effectifF)) * 1000) / 10;

  return (
    <>
      <Container as="section" fluid>
        <Row className="fr-mt-3w">
          <Col>
            <Title as="h2" look="h4">
              {data?.filieres[0]?.label}
              <Button
                className="fr-ml-1w"
                color="pink-tuile"
                icon="arrow-left-s-line"
                onClick={() =>
                  navigate("/atlas/effectifs-par-filiere?" + retParams)
                }
                size="sm"
                variant="tertiary"
              >
                Revenir à toutes les filières
              </Button>
            </Title>
          </Col>
        </Row>
        <Row className="fr-mb-5w" gutters>
          <Col>
            <StudentsCard
              descriptionNode={
                <Badge color="yellow-tournesol">{`Année universitaire ${currentYear}`}</Badge>
              }
              number={
                dataByYear?.find(
                  (el: DataByYear) => el.annee_universitaire === currentYear
                )?.effectif_total || 0
              }
              to="#"
            />
          </Col>
        </Row>
        {geoId !== "D075" && geoId !== "R00" && (
          <Row>
            <Col>
              <Map />
            </Col>
          </Row>
        )}
        <Row>
          <Col>
            <Title as="h3" look="h5">
              Données historiques depuis l'année universitaire{" "}
              <Badge color="yellow-tournesol">2001-02</Badge>
            </Title>
            <ColumnsChart
              data={dataByYear || []}
              label="effectif_total"
              currentYear={currentYear}
            />
          </Col>
        </Row>
        <Row className="fr-mt-5w">
          <Col md={6}>
            <Title as="h3" look="h5">
              Répartition des effectifs étudiants par secteur
            </Title>
            <Text>
              Les effectifs étudiants sont répartis entre le secteur public et
              le secteur privé.
              <br />
              <br />
              <strong>{effectifPU.toLocaleString()}</strong> étudiant
              {effectifPU > 1 ? "s sont inscrits" : " inscrit"} dans le secteur
              public et <strong>{effectifPR.toLocaleString()}</strong> étudiant
              {effectifPR > 1 ? "s inscrits" : "inscrit"} dans le secteur privé,
              soit une répartition de <strong>{pctPU}&nbsp;%</strong> dans le
              secteur public et <strong>{pctPR}&nbsp;%</strong> dans le secteur
              privé pour l'année universitaire{" "}
              <Badge color="yellow-tournesol">{currentYear}</Badge>.
            </Text>
          </Col>
          <Col md={6}>
            <SectorsCard
              currentYear={currentYear}
              values={{
                labels: data?.secteurs?.map((item) => item.label),
                values: data?.secteurs?.map((item) => item.value),
              }}
            />
          </Col>
        </Row>
        <Row className="fr-mt-5w">
          <Col md={6}>
            <Title as="h3" look="h5">
              Répartition des effectifs étudiants par genre
            </Title>
            <Text>
              Les effectifs étudiants sont répartis entre les genres masculin et
              féminin.
              <br />
              <br />
              {effectifM.toLocaleString()} étudiant
              {effectifM > 1 ? "s sont" : " est"} de genre masculin et{" "}
              <strong>{effectifF.toLocaleString()}</strong> étudiant
              {effectifF > 1 ? "s sont" : " est"} de genre féminin, soit une
              répartition de <strong>{pctM}&nbsp;%</strong> dans le genre
              masculin et <strong>{pctF}&nbsp;%</strong> dans le genre féminin
              pour l'année universitaire{" "}
              <Badge color="yellow-tournesol">{currentYear}</Badge>.
            </Text>
          </Col>
          <Col md={6}>
            <GendersCard
              currentYear={currentYear}
              values={{
                labels: data?.gender?.map((item) => item.label),
                values: data?.gender?.map((item) => item.value),
              }}
            />
          </Col>
        </Row>
      </Container>
    </>
  );
}
