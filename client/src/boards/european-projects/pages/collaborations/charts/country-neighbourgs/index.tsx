import { useQuery } from "@tanstack/react-query";
import { Badge, Col, Row, Container, Title } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";

import { getNeighbouringCountriesFromIso3 } from "../../../../../../utils";
import { getFlagEmoji } from "../../../../utils";
import { getCollaborations } from "./query";
import { useGetParams } from "./utils";
import i18nGlobal from "../../../../i18n-global.json";
import i18nLocal from "./i18n.json";

export default function CountryNeighbourgs() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const country_code = searchParams.get("country_code") || "FRA";
  const params = useGetParams();

  // Requête pour récupérer les données de collaboration
  const { data: collaborationsData, isLoading: isLoadingCollaborations } = useQuery({
    queryKey: ["CountriesCollaborations", params],
    queryFn: () => getCollaborations(params),
  });

  // Requête pour récupérer les pays frontaliers
  const { data: dataCountries } = useQuery({
    queryKey: ["getNeighbouringCountriesFromIso3", country_code],
    queryFn: () => getNeighbouringCountriesFromIso3(country_code),
  });

  const i18n = { ...i18nGlobal, ...i18nLocal };
  function getI18nLabel(key: string) {
    return i18n[key]?.[currentLang] || key;
  }

  // Affichage d'un message de chargement pendant que les données se chargent
  if (isLoadingCollaborations) {
    return (
      <Row>
        <Col>
          <div className="fr-tile fr-mt-2w">
            <div className="fr-tile__body">
              <div className="fr-tile__content">
                <p>Chargement des données des pays frontaliers...</p>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    );
  }

  if (!collaborationsData) {
    return null;
  }

  const total_collaborations = collaborationsData.reduce((acc, item) => acc + item.total_collaborations, 0);

  const neighbouringCountriesSum = dataCountries
    ? dataCountries.reduce((acc, code) => {
        const countryData = collaborationsData.find((item) => item.country_code === code);
        return acc + (countryData ? countryData.total_collaborations : 0);
      }, 0)
    : 0;

  const neighbouringCountriesSumWithCountry =
    neighbouringCountriesSum + (collaborationsData.find((item) => item.country_code === country_code)?.total_collaborations || 0);

  return (
    <Container fluid className="fr-mt-5w">
      <Row>
        <Col>
          <Title as="h2" look="h4" className="fr-mb-3w">
            {getI18nLabel("title")}
          </Title>
        </Col>
      </Row>
      <Row>
        <Col>
          <div className="fr-tile fr-mt-2w">
            <div className="fr-tile__body">
              <div className="fr-tile__content">
                <h3 className="fr-tile__title">
                  <span className="fr-icon-earth-fill fr-mr-1w" aria-hidden="true" />
                  <br />
                  {getI18nLabel("neighbouring-countries")}
                  <br />
                  <Badge>
                    {dataCountries ? dataCountries.length : 0} {getI18nLabel("countries")}
                    {" / "}
                    {collaborationsData.length}
                  </Badge>
                </h3>
                <p className="fr-tile__desc">
                  Les pays frontaliers comptabilisent <strong>{neighbouringCountriesSum.toLocaleString(currentLang)}</strong> projets, soit{" "}
                  <strong>{Math.floor((neighbouringCountriesSum / total_collaborations) * 100)} %</strong> des collaborations totales.
                  <br />
                  <br />
                  <strong>{Math.floor((neighbouringCountriesSumWithCountry / total_collaborations) * 100)} %</strong> en prenant en compte le pays
                  sélectionné ({getFlagEmoji(country_code)} {collaborationsData.find((item) => item.country_code === country_code)?.country_name_fr}).
                </p>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
