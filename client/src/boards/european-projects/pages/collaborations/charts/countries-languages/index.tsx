import { useQuery } from "@tanstack/react-query";
import { Badge, Col, Row, Container, Title } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";

import countriesLanguages from "../../../../../../assets/countries-languages.json";
import { getCollaborations } from "../country-neighbourgs/query";
import { useGetParams } from "../country-neighbourgs/utils";
import i18nGlobal from "../../../../i18n-global.json";
import i18nLocal from "./i18n.json";

export default function CountryLanguages() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const country_code = searchParams.get("country_code") || "FRA";
  const params = useGetParams();

  const { data: collaborationsData, isLoading } = useQuery({
    queryKey: ["CountriesCollaborations", params],
    queryFn: () => getCollaborations(params),
  });

  const i18n = { ...i18nGlobal, ...i18nLocal };
  function getI18nLabel(key: string) {
    return i18n[key]?.[currentLang] || key;
  }

  if (isLoading) {
    return (
      <Row>
        <Col>
          <div className="fr-tile fr-mt-2w">
            <div className="fr-tile__body">
              <div className="fr-tile__content">
                <p>Chargement des statistiques par langues...</p>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    );
  }

  if (!collaborationsData) return null;

  const allCountries = countriesLanguages as Record<string, string[]>;
  const selectedCountryLanguages: string[] = allCountries[country_code] || [];
  const total_collaborations = collaborationsData.reduce((acc, item) => acc + item.total_collaborations, 0);

  // Pays partageant au moins une langue avec le pays sélectionné (hors le pays lui-même, avec collaborations effectives)
  const sharedLanguageCountries = collaborationsData.filter((item) => {
    if (item.country_code === country_code) return false;
    if (!item.total_collaborations) return false;
    const itemLanguages: string[] = allCountries[item.country_code] || [];
    return itemLanguages.some((lang) => selectedCountryLanguages.includes(lang));
  });

  const sharedLanguageSum = sharedLanguageCountries.reduce((acc, item) => acc + item.total_collaborations, 0);

  // Calcul des collaborations par langue partagée
  const languageStats: Record<string, { count: number; collaborations: number; countryNames: string[] }> = {};
  for (const lang of selectedCountryLanguages) {
    const countriesWithLang = collaborationsData.filter((item) => {
      if (item.country_code === country_code) return false;
      if (!item.total_collaborations) return false;
      const itemLanguages: string[] = allCountries[item.country_code] || [];
      return itemLanguages.includes(lang);
    });
    if (countriesWithLang.length > 0) {
      const sorted = [...countriesWithLang].sort((a, b) => b.total_collaborations - a.total_collaborations);
      languageStats[lang] = {
        count: sorted.length,
        collaborations: sorted.reduce((acc, item) => acc + item.total_collaborations, 0),
        countryNames: sorted.map((item) => (currentLang === "fr" ? item.country_name_fr : item.country_name_en) || item.country_code),
      };
    }
  }

  const topLanguages = Object.entries(languageStats)
    .sort((a, b) => b[1].collaborations - a[1].collaborations)
    .slice(0, 3);

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
                  <span className="fr-icon-discuss-line fr-mr-1w" aria-hidden="true" />
                  <br />
                  {getI18nLabel("shared-language-countries")}
                  <br />
                  <Badge>
                    {sharedLanguageCountries.length} {getI18nLabel("countries")}
                    {" / "}
                    {collaborationsData.length}
                  </Badge>
                </h3>
                <p className="fr-tile__desc">
                  {getI18nLabel("selected-country-languages")} :{" "}
                  <strong>{selectedCountryLanguages.length > 0 ? selectedCountryLanguages.join(", ") : getI18nLabel("no-languages")}</strong>
                  <br />
                  <br />
                  {getI18nLabel("shared-language-collaborations-text")} <strong>{sharedLanguageSum.toLocaleString("fr-FR")}</strong>{" "}
                  {getI18nLabel("projects")}, {getI18nLabel("which-is")}{" "}
                  <strong>{total_collaborations > 0 ? Math.floor((sharedLanguageSum / total_collaborations) * 100) : 0} %</strong>{" "}
                  {getI18nLabel("of-total-collaborations")}.
                  {topLanguages.length > 0 && (
                    <>
                      <br />
                      <br />
                      {getI18nLabel("top-languages")} :{" "}
                      {topLanguages.map(([lang, stats], i) => (
                        <span key={lang}>
                          <strong>{lang}</strong> ({stats.collaborations.toLocaleString("fr-FR")} {getI18nLabel("projects")},{" "}
                          <abbr title={stats.countryNames.join(", ")} style={{ cursor: "help", textDecorationStyle: "dotted" }}>
                            {stats.count} {getI18nLabel("countries")}
                          </abbr>
                          ){i < topLanguages.length - 1 ? "; " : ""}
                        </span>
                      ))}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
