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

import Gauge from "../../components/gauge/index.tsx";
import MapSkeleton from "../../charts/skeletons/map.tsx";
import MapWithPolygonAndBubbles from "../../charts/map-with-polygon-and-bubbles.tsx";
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

import "../styles.scss";

const OVERSEAS_CENTERS: Record<string, { lat: number; lon: number }> = {
  D988: { lat: -21.7, lon: 166 },
  A40: { lat: -21.7, lon: 166 },
  D987: { lat: -17.6, lon: -149.5 },
  A41: { lat: -17.6, lon: -149.5 },
  D978: { lat: 18.07, lon: -63.1 },
  "978": { lat: 18.07, lon: -63.1 },
  D986: { lat: -13.3, lon: -178 },
  A42: { lat: -13.3, lon: -178 },
};

const FRANCE_INSETS = [
  { id: "D988", className: "col1", label: "Nouvelle-Calédonie" },
  { id: "D987", className: "col2", label: "Polynésie française" },
  { id: "D978", className: "col3", label: "Saint-Martin" },
  { id: "D986", className: "col4", label: "Wallis et Futuna" },
  { id: "R01", className: "drom1", label: "Guadeloupe" },
  { id: "R02", className: "drom2", label: "Martinique" },
  { id: "R03", className: "drom3", label: "Guyane" },
  { id: "R04", className: "drom4", label: "La Réunion" },
  { id: "R06", className: "drom5", label: "Mayotte" },
];

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
    return <div>Chargement ...</div>
  }

  function Map() {
    if (isLoadingPolygons || isLoadingfield) {
      return <MapSkeleton />;
    }

    if (!polygonsData?.length || !fieldData?.length) {
      return <Text>Aucune donnée cartographique disponible pour cette filière et cette zone géographique.</Text>;
    }

    const mapbubbleData: MapBubbleDataProps = [];
    fieldData.forEach((item) => {
      const overseas = OVERSEAS_CENTERS[item.id];
      if (overseas) {
        mapbubbleData.push({
          z: item.effectif_total || 0,
          name: item.nom,
          ...overseas,
        });
        return;
      }
      const polygon = polygonsData.find((d) => d.originalId === item.id)?.geometry;
      if (polygon) {
        const center = turf.centerOfMass(polygon);
        mapbubbleData.push({
          z: item.effectif_total || 0,
          name: item.nom,
          lat: center.geometry.coordinates[1],
          lon: center.geometry.coordinates[0],
        });
      }
    });

    const renderMap = (idToFocus?: string) => <MapWithPolygonAndBubbles currentYear={currentYear} idToFocus={idToFocus} isLoading={false} mapbubbleData={mapbubbleData} polygonsData={polygonsData} />;

    if (geoId !== "PAYS_100") {
      return renderMap();
    }

    return (
      <div className="atlas-map">
        <div className="container">
          <div className="Map1">{renderMap()}</div>
          {FRANCE_INSETS.map(({ id, className, label }) => (
            <div className={className} key={id}>
              <div className="item">
                {renderMap(id)}
                <div className="item-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const effectifPU =
    dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)
      ?.effectif_pu || 0;
  const effectifPR =
    dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)
      ?.effectif_pr || 0;
  const totalSecteur = effectifPU + effectifPR;
  const pctPU = totalSecteur ? Math.round((effectifPU / totalSecteur) * 1000) / 10 : 0;
  const pctPR = totalSecteur ? Math.round((effectifPR / totalSecteur) * 1000) / 10 : 0;

  const effectifM =
    dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)
      ?.effectif_masculin || 0;
  const effectifF =
    dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)
      ?.effectif_feminin || 0;
  const totalGenre = effectifM + effectifF;
  const pctM = totalGenre ? Math.round((effectifM / totalGenre) * 1000) / 10 : 0;
  const pctF = totalGenre ? Math.round((effectifF / totalGenre) * 1000) / 10 : 0;

  return (
    <>
      <Container as="section" fluid>
        <Row className="fr-mt-3w">
          <Col>
            <Title as="h2" look="h4">
              {data?.filieres[0]?.label}
              <Button className="fr-ml-1w" color="pink-tuile" icon="arrow-left-s-line" onClick={() => navigate("/atlas/effectifs-par-filiere?" + retParams)} size="sm" variant="tertiary">
                Revenir à toutes les filières
              </Button>
            </Title>
          </Col>
        </Row>
        <Row>
          <Col>
            <StudentsCard descriptionNode={<Badge color="yellow-tournesol">{`Année universitaire ${currentYear}`}</Badge>} number={dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)?.effectif_total || 0} to="#" />
          </Col>
        </Row>
        {geoId !== "D075" && geoId !== "R00" && (
          <Row className="fr-mt-5w">
            <Col>
              <Title as="h3" look="h5">
                Répartition géographique
              </Title>
              <Map />
            </Col>
          </Row>
        )}
        <Row className="fr-mt-5w">
          <Col>
            <Title as="h3" look="h5">
              Données historiques depuis l'année universitaire {currentYear}
            </Title>
            <ColumnsChart data={dataByYear || []} label="effectif_total" currentYear={currentYear} />
          </Col>
        </Row>
        <Row className="fr-mt-5w atlas-bloc">
          <Col md={12}>
            <Title as="h3" look="h5">
              Répartition des effectifs étudiants par secteur
            </Title>
            <Text>
              Les effectifs étudiants sont répartis entre le secteur public et le secteur privé.
              <br />
              <br />
              <strong>{effectifPU.toLocaleString("fr-FR")}</strong> étudiant
              {effectifPU > 1 ? "s sont inscrits" : " inscrit"} dans le secteur public et <strong>{effectifPR.toLocaleString("fr-FR")}</strong> étudiant
              {effectifPR > 1 ? "s inscrits" : " inscrit"} dans le secteur privé pour l'année universitaire <Badge color="yellow-tournesol">{currentYear}</Badge>
              {totalSecteur > 0 ? (
                <>
                  , soit une répartition de <strong>{pctPU}&nbsp;%</strong> dans le secteur public et <strong>{pctPR}&nbsp;%</strong> dans le secteur privé, sur {totalSecteur.toLocaleString("fr-FR")} étudiant{totalSecteur > 1 ? "s" : ""} au total.
                </>
              ) : (
                <>. La répartition n'est pas calculable en l'absence d'effectifs.</>
              )}
            </Text>
            {totalSecteur > 0 && (
              <Gauge
                values={{
                  effectifPU: { label: "Secteur public", value: effectifPU, color: "var(--public-sector)" },
                  effectifPR: { label: "Secteur privé", value: effectifPR, color: "var(--private-sector)" },
                }}
              />
            )}
          </Col>
        </Row>
        <Row className="fr-my-5w atlas-bloc">
          <Col md={12}>
            <Title as="h3" look="h5">
              Répartition des effectifs étudiants par genre
            </Title>
            <Text>
              Les effectifs étudiants sont répartis entre les genres masculin et féminin.
              <br />
              <br />
              {effectifM.toLocaleString("fr-FR")} étudiant
              {effectifM > 1 ? "s sont" : " est"} de genre masculin et <strong>{effectifF.toLocaleString("fr-FR")}</strong> étudiant
              {effectifF > 1 ? "s sont" : " est"} de genre féminin pour l'année universitaire <Badge color="yellow-tournesol">{currentYear}</Badge>
              {totalGenre > 0 ? (
                <>
                  , soit une répartition de <strong>{pctM}&nbsp;%</strong> dans le genre masculin et <strong>{pctF}&nbsp;%</strong> dans le genre féminin, sur {totalGenre.toLocaleString("fr-FR")} étudiant{totalGenre > 1 ? "s" : ""} au total.
                </>
              ) : (
                <>. La répartition n'est pas calculable en l'absence d'effectifs.</>
              )}
            </Text>
            {totalGenre > 0 && (
              <Gauge
                values={{
                  effectifM: { label: "Masculin", value: effectifM, color: "var(--men-color)" },
                  effectifF: { label: "Féminin", value: effectifF, color: "var(--women-color)" },
                }}
              />
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}
