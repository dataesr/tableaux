import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Badge,
  Button,
  Container,
  Row,
  Col,
  Spinner,
  Text,
  Title,
} from "@dataesr/dsfr-plus";

import StudentsCardWithTrend from "../../../../components/cards/students-card-with-trend/index.js";
import TrendCard from "../../charts/trend.tsx";
import {
  getFiltersValues,
  getGeoIdsFromSearch,
  getNumberOfStudentsByYear,
} from "../../../../api/atlas.js";
import FavoritesList from "../../components/favorites-list/index.tsx";
import { GetLevelBadgeFromItem } from "../../utils/badges.js";

import "./styles.scss";
import { DataByYear } from "../../../../types/atlas.ts";
import { useAtlas } from "../../useAtlas.tsx";

type SearchTypes = {
  geo_id: string;
  geo_nom: string;
};

export function Search() {
  const [searchParams] = useSearchParams();
  const [territoiresType, setTerritoiresType] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const datasupr = params.get("datasupr") === "true";
  const { DEFAULT_CURRENT_YEAR } = useAtlas();
  const currentYear =
    searchParams.get("annee_universitaire") || DEFAULT_CURRENT_YEAR;

  const { data: filtersValues, isLoading: isLoadingFiltersValues } = useQuery({
    queryKey: ["atlas/get-filters-values"],
    queryFn: () => getFiltersValues(),
  });

  const { data: dataByYear } = useQuery({
    queryKey: ["atlas/number-of-students-by-year", params],
    queryFn: () =>
      getNumberOfStudentsByYear(`?annee_universitaire=${currentYear}`),
  });

  const {
    data: dataSearch,
    isLoading: isLoadingSearch,
    refetch,
  } = useQuery({
    queryKey: ["atlas/search", searchValue],
    queryFn: () => getGeoIdsFromSearch(searchValue),
    enabled: false,
  }); // TODO: add a debounce + delete unused props

  const handleClick = async () => {
    refetch();
  };

  if (isLoadingFiltersValues) {
    return <Spinner />;
  }

  const nbStudents =
    dataByYear?.find((el: DataByYear) => el.annee_universitaire === currentYear)
      ?.effectif_total || 0;

  // Create a list of all territories (regions, departments, academies - without cities)
  const territoiresList = Object.keys(filtersValues.geo_id)
    .map((key) => {
      if (key !== "communes") {
        return filtersValues.geo_id[key].map((item) => ({
          id: item.geo_id,
          label: item.geo_nom,
          type: key,
        }));
      }
    })
    .flat();

  // Sort the list of territories by label
  territoiresList.sort((a, b) => a.label.localeCompare(b.label));

  function GetFilterButton({ type, label }) {
    if (!dataSearch) {
      return null;
    }
    return (
      <li className={territoiresType === type ? "active" : ""}>
        {dataSearch?.filter((el) => el.niveau_geo === type)?.length === 0 &&
        type !== "all" ? null : (
          <span onClick={() => setTerritoiresType(type)}>
            {label}
            <Badge className="fr-ml-1w" color="pink-tuile">
              {(type === "all" && dataSearch?.length) ||
                dataSearch?.filter((el) => el.niveau_geo === type)?.length}
            </Badge>
          </span>
        )}
      </li>
    );
  }

  const filteredData =
    territoiresType !== "all"
      ? dataSearch?.filter((el) => el.niveau_geo === territoiresType)
      : dataSearch;

  return (
    <Container as="section">
      <Row className="fr-mb-5w">
        <Col md={7}>
          <Container fluid>
            <Row>
              <Col>
                <Title as="h1" look="h6">
                  Atlas des effectifs étudiants
                </Title>
                <Text>
                  L’Atlas des effectifs étudiants est un outil indispensable pour une bonne appréhension de la structuration territoriale de l’enseignement supérieur et pour l’élaboration de stratégies territoriales. Il présente, sous forme de
                  cartes, de graphiques et de tableaux, la diversité du système français d’enseignement supérieur.
                  <br />
                  <br />
                  L’Atlas comprend le niveau géographique « France » comme l’agrégat regroupant la France métropolitaine, les départements et régions d’Outre-mer (DROM), et les autres collectivités d’outre-mer (COM) et la Nouvelle-Calédonie. Les
                  effectifs d’étudiants inscrits dans une implantation à l’étranger d’un établissement dont le siège est situé en France ne sont comptabilisés ni au niveau de la France ni aux différents niveaux géographiques (unité urbaine ou commune
                  rurale, département, académie, région) auxquelles appartient l’établissement d’origine.
                </Text>
              </Col>
            </Row>
            <Row className="fr-mt-5w">
              <Col md={9} className="search">
                <Title as="h2" look="h6" className="fr-mb-1w">
                  <label className="fr-label" htmlFor="text-input-text">
                    Rechercher un territoire
                  </label>
                </Title>
                <input
                  className="fr-input"
                  id="text-input-text"
                  name="text-input-text"
                  onChange={(e) => setSearchValue(e.target.value)}
                  onClick={() => {
                    setSearchValue("");
                  }}
                  onKeyUp={(e) => {
                    if (e.key === "Enter") handleClick();
                  }}
                  type="text"
                  value={searchValue}
                />
              </Col>
              <Col md={3}>
                <Button className="fr-mt-4w" icon="search-line" onClick={handleClick}>
                  Rechercher
                </Button>
              </Col>
            </Row>
            <Row>
              <Col>
                <div className="territories-filter">
                  <ul>
                    {dataSearch?.length > 0 && <span className="fr-icon-filter-line" aria-hidden="true" />}
                    <GetFilterButton type="all" label="Tous" />
                    <GetFilterButton type="REGION" label="Régions" />
                    <GetFilterButton type="ACADEMIE" label="Académies" />
                    <GetFilterButton type="DEPARTEMENT" label="Départements" />
                    <GetFilterButton type="UNITE_URBAINE" label="Unités urbaines" />
                    <GetFilterButton type="COMMUNE" label="Communes" />
                  </ul>
                </div>

                {isLoadingSearch && (
                  <div className="fr-pt-2w">
                    <Spinner />
                  </div>
                )}

                {!isLoadingSearch && dataSearch?.length === undefined && (
                  <div className="results">
                    <i className="hint">
                      Saisissez un mot clé pour rechercher un territoire. Par exemple : "Paris", "Bretagne", etc ...
                      <br />
                      Puis cliquez sur le bouton <strong>"Rechercher"</strong>
                    </i>
                  </div>
                )}

                {dataSearch?.length > 0 ? (
                  <ul className="results">
                    {filteredData.map((result: SearchTypes) => (
                      <li
                        key={result.geo_id}
                        onClick={() => {
                          navigate(`/atlas/general?geo_id=${result.geo_id}&annee_universitaire=${currentYear}${datasupr ? "&datasupr" : ""}`);
                        }}
                      >
                        <span
                          onClick={() => {
                            navigate(result.geo_id);
                          }}
                        >
                          <strong>
                            <u>{result.geo_nom}</u>
                          </strong>
                          <div>
                            code : {result.geo_id}
                            {GetLevelBadgeFromItem(result)}
                          </div>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Col>
            </Row>
          </Container>
        </Col>
        <Col md={4} offsetMd={1}>
          <Container fluid className="fr-mb-1w">
            <StudentsCardWithTrend
              descriptionNode={<Badge color="yellow-tournesol">{currentYear}</Badge>}
              number={nbStudents}
              label={`Étudiant${nbStudents > 1 ? "s" : ""} inscrit${nbStudents > 1 ? "s" : ""} en France`}
              trendGraph={<TrendCard color="#e18b76" data={dataByYear?.map((item) => item.effectif_total)} />}
            />
          </Container>
          <FavoritesList territoiresList={territoiresList} />
        </Col>
      </Row>
    </Container>
  );
}
