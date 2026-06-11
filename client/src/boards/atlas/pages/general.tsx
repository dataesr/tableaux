import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Badge,
  Container,
  Row,
  Col,
  Title,
  Text,
  Link,
} from "@dataesr/dsfr-plus";
import * as turf from "@turf/turf";

import { DataByYear } from "../../../types/atlas.ts";
import {
  getNumberOfStudents,
  getNumberOfStudentsHistoricByLevel,
  getGeoPolygon,
} from "../../../api/atlas.ts";
import { getNumberOfStudentsByYear } from "../../../api/atlas.ts";
import { MapBubbleDataProps } from "../../../types/atlas.ts";
import FieldsMainCard from "../../../components/cards/fields-main-card/index.tsx";
import GendersCard from "../../../components/cards/genders-card/index.tsx";
import SectorsCard from "../../../components/cards/sectors-card/index.tsx";
import StudentsCardWithTrend from "../../../components/cards/students-card-with-trend/index.tsx";
import TrendCard from "../charts/trend.tsx";
import SubList from "../components/sub-list.tsx";
import MapWithPolygonAndBubbles from "../charts/map-with-polygon-and-bubbles.tsx";
import MapSkeleton from "../charts/skeletons/map.tsx";
import ArrondissementsMap from "../charts/arrondissements-map/index.tsx";

import { useAtlas } from "../useAtlas.tsx";

import "./styles.scss";
import Callout from "../components/callout.tsx";
import BoardsSuggestComponent from "../../../components/boards-suggest-component/index.tsx";

export default function General() {
  const [searchParams] = useSearchParams();
  const params = [...searchParams].map(([key, value]) => `${key}=${value}`).join("&");
  const geoId = searchParams.get("geo_id") || "";
  const { DEFAULT_CURRENT_YEAR } = useAtlas();
  const currentYear = searchParams.get("annee_universitaire") || DEFAULT_CURRENT_YEAR;

  const { data, isLoading } = useQuery({
    queryKey: ["atlas/number-of-students", params],
    queryFn: () => getNumberOfStudents(params),
  });

  const { data: dataByYear, isLoading: isLoadingByYear } = useQuery({
    queryKey: ["atlas/number-of-students-by-year", params],
    queryFn: () => getNumberOfStudentsByYear(params),
  });

  const { data: dataHistoric, isLoading: isLoadingHistoric } = useQuery({
    queryKey: ["atlas/number-of-students-historic-by-level", geoId, currentYear],
    queryFn: () => getNumberOfStudentsHistoricByLevel(geoId, currentYear),
  });

  const { data: polygonsData, isLoading: isLoadingPolygons } = useQuery({
    queryKey: ["atlas/get-geo-polygons", geoId],
    queryFn: () => getGeoPolygon(geoId),
  });

  if (isLoading || isLoadingByYear) {
    return <div>Chargement ...</div>;
  }

  const effectifPU = dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)?.effectif_pu || 0;
  const effectifPR = dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)?.effectif_pr || 0;
  const pctPU = Math.round((effectifPU / (effectifPU + effectifPR)) * 100);
  const pctPR = Math.round((effectifPR / (effectifPU + effectifPR)) * 100);

  const effectifM = dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)?.effectif_masculin || 0;
  const effectifF = dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)?.effectif_feminin || 0;
  const pctM = Math.round((effectifM / (effectifM + effectifF)) * 100);
  const pctF = Math.round((effectifF / (effectifM + effectifF)) * 100);

  const getSubLevelName = () => {
    if (!geoId || geoId === "PAYS_100") {
      return "région";
    }
    if (geoId.startsWith("R")) {
      return "académie";
    }
    if (geoId.startsWith("D")) {
      return "commune";
    }
    if (geoId.startsWith("A")) {
      return "département";
    }
    if (geoId.startsWith("U")) {
      return "commune";
    }
    return "commune";
  };

  function MapSelector() {
    if (isLoadingPolygons || !polygonsData || !polygonsData.length || isLoadingHistoric || !dataHistoric?.data || !dataHistoric?.data.length) {
      return <MapSkeleton />;
    }

    const mapbubbleData: MapBubbleDataProps = [];
    dataHistoric.data
      .filter((item) => item.geo_id !== "R00")
      .forEach((item) => {
        let polygon;
        switch (item.geo_id) {
          // Nouvelle-Calédonie
          case "D988":
          case "A40":
            mapbubbleData.push({
              z: item.data.find((d) => d.annee_universitaire === currentYear)?.effectif || 0,
              name: item.geo_nom,
              lat: -21.7,
              lon: 166,
            });
            break;

          // Polynésie française
          case "D987":
          case "A41":
            mapbubbleData.push({
              z: item.data.find((d) => d.annee_universitaire === currentYear)?.effectif || 0,
              name: item.geo_nom,
              lat: -17.6,
              lon: -149.5,
            });
            break;

          // Saint-Martin
          case "978":
          case "D978":
            mapbubbleData.push({
              z: item.data.find((d) => d.annee_universitaire === currentYear)?.effectif || 0,
              name: item.geo_nom,
              lat: 18.07,
              lon: -63.1,
            });
            break;

          // Wallis et Futuna
          case "D986":
          case "A42":
            mapbubbleData.push({
              z: item.data.find((d) => d.annee_universitaire === currentYear)?.effectif || 0,
              name: item.geo_nom,
              lat: -13.3,
              lon: -178,
            });
            break;

          default:
            polygon = polygonsData.find((d) => d.originalId === item.geo_id)?.geometry || null;
            if (polygon !== "undefined" && polygon !== null) {
              const calculateCenter = turf.centerOfMass(polygon);
              mapbubbleData.push({
                z: item.data.find((d) => d.annee_universitaire === currentYear)?.effectif || 0,
                name: item.geo_nom,
                lat: calculateCenter.geometry.coordinates[1],
                lon: calculateCenter.geometry.coordinates[0],
              });
            }
        }
      });

    // France case
    if (geoId === "PAYS_100") {
      return (
        <div className="atlas-map">
          <Row className="fr-my-5w">
            <Col>
              <Title as="h3" look="h5">
                <span className="fr-icon-pie-chart-2-fill fr-mr-1w" aria-hidden="true" />
                {`Répartition des effectifs étudiants par ${getSubLevelName()}`}
              </Title>
            </Col>
          </Row>
          <div className="container">
            <div className="Map1">
              <MapWithPolygonAndBubbles currentYear={currentYear} isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
            </div>
            <div className="col1">
              <div className="item ">
                <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="D988" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                <div className="item-label">Nouvelle-Calédonie</div>
              </div>
            </div>
            <div className="col2">
              <div className="item ">
                <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="D987" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                <div className="item-label">Polynésie française</div>
              </div>
            </div>
            <div className="col3">
              <div className="item ">
                <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="D978" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                <div className="item-label">Saint-Martin</div>
              </div>
            </div>
            <div className="col4">
              <div className="item ">
                <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="D986" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                <div className="item-label">Wallis et Futuna</div>
              </div>
            </div>
            <div className="drom1">
              <div className="item">
                <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="R01" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                <div className="item-label">Guadeloupe</div>
              </div>
            </div>
            <div className="drom2">
              <div className="item">
                <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="R02" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                <div className="item-label">Martinique</div>
              </div>
            </div>
            <div className="drom3">
              <div className="item">
                <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="R03" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                <div className="item-label">Guyane</div>
              </div>
            </div>
            <div className="drom4">
              <div className="item">
                <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="R04" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                <div className="item-label">La Réunion</div>
              </div>
            </div>
            <div className="drom5">
              <div className="item">
                <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="R06" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                <div className="item-label">Mayotte</div>
              </div>
            </div>
          </div>

          <Row className="fr-mt-5w">
            <Col>
              <SubList />
            </Col>
          </Row>
        </div>
      );
    } else {
      // cas particuliers des arrondissements (Paris/Lyon/Marseille)
      if (geoId === "D075") {
        return (
          <>
            <Row className="fr-my-5w">
              <Col>
                <Title as="h3" look="h5">
                  <span className="fr-icon-pie-chart-2-fill fr-mr-1w" aria-hidden="true" />
                  Répartition des effectifs étudiants à Paris
                </Title>
              </Col>
            </Row>
            <Row gutters>
              <Col md={8}>
                <Title as="h4" look="h6">
                  Arrondissements de Paris
                </Title>
                <ArrondissementsMap location="paris" />
              </Col>
              <Col md={4}>
                <SubList />
              </Col>
            </Row>
          </>
        );
      }

      // cas particulier des collectivités d'outre-mer
      if (geoId === "R00") {
        return (
          <>
            <Row className="fr-my-5w">
              <Col>
                <Title as="h3" look="h5">
                  <span className="fr-icon-pie-chart-2-fill fr-mr-1w" aria-hidden="true" />
                  Répartition des effectifs étudiants dans les collectivités d'outre-mer
                </Title>
              </Col>
            </Row>
            <Row gutters>
              <Col md={8}>
                <Row gutters>
                  <Col md={6}>
                    <div className="standard-item">
                      <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="D988" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                      <div className="item-label">Nouvelle-Calédonie</div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="standard-item">
                      <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="D987" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                      <div className="item-label">Polynésie française</div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="standard-item">
                      <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="D978" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                      <div className="item-label">Saint-Martin</div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="standard-item">
                      <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus="D986" isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                      <div className="item-label">Wallis et Futuna</div>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col md={4}>
                <SubList />
              </Col>
            </Row>
          </>
        );
      }

      if (polygonsData.length > 1) {
        return (
          <>
            <Row className="fr-my-5w">
              <Col>
                <Title as="h3" look="h5">
                  <span className="fr-icon-pie-chart-2-fill fr-mr-1w" aria-hidden="true" />
                  {`Répartition des effectifs étudiants par ${getSubLevelName()}`}
                </Title>
              </Col>
            </Row>
            <Row gutters>
              <Col md={8}>
                <MapWithPolygonAndBubbles currentYear={currentYear} isLoading={isLoadingHistoric} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />
                {geoId === "D069" && (
                  <>
                    <Title as="h4" look="h6">
                      Arrondissements de Lyon
                    </Title>
                    <ArrondissementsMap location="lyon" />
                  </>
                )}
                {geoId === "D013" && (
                  <>
                    <Title as="h4" look="h6">
                      Arrondissements de Marseille
                    </Title>
                    <ArrondissementsMap location="marseille" />
                  </>
                )}
              </Col>
              <Col md={4}>
                <SubList />
              </Col>
            </Row>
          </>
        );
      } else {
        return (
          <Row className="fr-my-5w">
            <Col>
              <SubList />
            </Col>
          </Row>
        );
      }
    }
  }

  const nbStudents = dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)?.effectif_total || 0;

  return (
    <Container as="section" fluid>
      {geoId === "PAYS_100" && (
        <div className="fr-mb-3w">
          <Callout>
            L’Atlas comprend le niveau géographique « France » comme l’agrégat regroupant la France métropolitaine, les départements et régions d’Outre-mer (DROM), et les autres collectivités d’outre-mer (COM) et la Nouvelle-Calédonie. Les effectifs
            d’étudiants inscrits dans une implantation à l’étranger d’un établissement dont le siège est situé en France ne sont comptabilisés ni au niveau de la France ni aux différents niveaux géographiques (unité urbaine ou commune rurale,
            département, académie, région) auxquelles appartient l’établissement d’origine.
          </Callout>
        </div>
      )}
      <Row gutters>
        <Col md={6}>
          <StudentsCardWithTrend
            descriptionNode={<Badge color="yellow-tournesol">{currentYear}</Badge>}
            number={nbStudents}
            label={`Étudiant${nbStudents > 1 ? "s" : ""} inscrit${nbStudents > 1 ? "s" : ""}`}
            trendGraph={<TrendCard color="#000091" data={dataByYear?.map((item) => item.effectif_total)} />}
          />
        </Col>
        <Col md={6}>
          <FieldsMainCard
            descriptionNode={<Badge color="yellow-tournesol">{currentYear}</Badge>}
            number={data?.filieres?.filter((el) => el.effectif_PR || el.effectif_PU).length || 0}
            label="Nombre de filières représentées sur le territoire"
            to={`/atlas/effectifs-par-filiere?${params}`}
          />
        </Col>
      </Row>
      <MapSelector />
      <Row className="fr-mt-5w">
        <Col md={6}>
          <Title as="h3" look="h5">
            Répartition des effectifs étudiants par secteur
          </Title>
          <Text>
            Les effectifs étudiants sont répartis entre le secteur public et le secteur privé.
            <br />
            <br />
            {effectifPU === 0 ? (
              <>Il n'y a pas d'étudiant inscrit dans le secteur public</>
            ) : (
              <>
                <strong>{effectifPU.toLocaleString()}</strong> étudiants sont inscrits dans le secteur public
              </>
            )}{" "}
            et{" "}
            {effectifPR === 0 ? (
              <>il n'y a pas d'étudiant inscrit dans le secteur privé</>
            ) : (
              <>
                <strong>{effectifPR.toLocaleString()}</strong> étudiants sont inscrits dans le secteur privé
              </>
            )}
            , soit une répartition de <strong>{pctPU.toFixed(1)}&nbsp;%</strong> dans le secteur public et <strong>{pctPR.toFixed(1)}&nbsp;%</strong> dans le secteur privé pour l'année universitaire{" "}
            <Badge color="yellow-tournesol">{currentYear}</Badge>.
          </Text>
          <Link href={`/atlas/effectifs-par-secteur?${params}`}>Voir le détail des effectifs par secteur</Link>
        </Col>
        <Col md={6}>
          <SectorsCard
            currentYear={currentYear}
            values={{
              labels: data?.secteurs?.filter((item) => item.label !== undefined).map((item) => item.label) || [],
              values: data?.secteurs?.filter((item) => item.value !== 0).map((item) => item.value) || [],
            }}
          />
        </Col>
      </Row>
      <Row className="fr-mt-5w fr-mb-5w">
        <Col md={6}>
          <Title as="h3" look="h5">
            Répartition des effectifs étudiants par genre
          </Title>
          <Text>
            Les effectifs étudiants sont répartis entre les genres masculin et féminin.
            <br />
            <br />
            {effectifM === 0 ? (
              <>Il n'y a pas d'étudiant de genre masculin</>
            ) : (
              <>
                <strong>{effectifM.toLocaleString()}</strong> étudiants sont de genre masculin
              </>
            )}{" "}
            et{" "}
            {effectifF === 0 ? (
              <>il n'y a pas d'étudiant de genre féminin</>
            ) : (
              <>
                <strong>{effectifF.toLocaleString()}</strong> étudiants sont de genre féminin
              </>
            )}
            , soit une répartition de <strong>{pctM.toFixed(1)}&nbsp;%</strong> dans le genre masculin et <strong>{pctF.toFixed(1)}&nbsp;%</strong> dans le genre féminin pour l'année universitaire <Badge color="yellow-tournesol">{currentYear}</Badge>
            .
          </Text>
          <Link href={`/atlas/effectifs-par-genre?${params}`}>Voir le détail des effectifs par genre</Link>
        </Col>
        <Col md={6}>
          <GendersCard
            currentYear={currentYear}
            values={{
              labels: data?.gender?.filter((item) => item.label !== undefined).map((item) => item.label) || [],
              values: data?.gender?.filter((item) => item.value !== 0).map((item) => item.value) || [],
            }}
          />
        </Col>
      </Row>
      <Row>
        <BoardsSuggestComponent />
      </Row>
    </Container>
  );
}
