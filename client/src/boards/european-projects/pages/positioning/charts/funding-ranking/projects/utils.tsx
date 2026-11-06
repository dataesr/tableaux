import { useSearchParams } from "react-router-dom";

import { getI18nLabel } from "../../../../../../../utils";
import i18nGlobal from "../../../../../i18n-global.json";
import { isEjoParam } from "../../../../../utils/params";
import i18nLocal from "./i18n.json";

const i18n = { ...i18nGlobal, ...i18nLocal };

export function useGetParams() {
  const [searchParams] = useSearchParams();

  const params: string[] = [];

  const countryCode = searchParams.get("country_code");
  if (countryCode) {
    params.push(`country_code=${countryCode}`);
  }

  const pillarId = searchParams.get("pillarId");
  if (pillarId) {
    params.push(`pillars=${pillarId}`);
  }

  const programId = searchParams.get("programId");
  if (programId) {
    params.push(`programs=${programId}`);
  }

  const thematicIds = searchParams.get("thematicIds");
  if (thematicIds) {
    params.push(`thematics=${thematicIds}`);
  }

  const destinationIds = searchParams.get("destinationIds");
  if (destinationIds) {
    params.push(`destinations=${destinationIds}`);
  }

  // Récupérer le paramètre range_of_years et le convertir en call_year pour l'API
  const rangeOfYears = searchParams.get("range_of_years");
  if (rangeOfYears) {
    params.push(`range_of_years=${rangeOfYears}`);
  }

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }

  return params.filter((item) => !!item).join("&");
}

const getOrdinal = (rank: number, lang: string) => {
  if (lang === "fr") {
    return rank === 1 ? "ère" : "ème";
  }
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
};

export function readingKey(data, selectedCountryCode: string | null = null) {
  const country = (selectedCountryCode && data?.find((item) => item.id === selectedCountryCode)) || data?.[0];
  if (!country) {
    return { fr: <></>, en: <></> };
  }

  const sameRank = country.rank_projects_evaluated === country.rank_projects_successful;
  const ratio = (country.ratio_projects ?? 0).toFixed(1);

  return {
    fr: (
      <>
        Le pays <strong>{country.name_fr}</strong> se place au{" "}
        <strong>
          {country.rank_projects_evaluated}
          {getOrdinal(country.rank_projects_evaluated, "fr")}
        </strong>{" "}
        rang des pays en nombre de projets évalués (<strong>{country.total_projects_evaluated}</strong>)
        {sameRank ? " ainsi qu'au " : " et au "}
        <strong>
          {country.rank_projects_successful}
          {getOrdinal(country.rank_projects_successful, "fr")}
        </strong>{" "}
        rang en nombre de projets lauréats (<strong>{country.total_projects_successful}</strong>). Son taux de succès s'élève à <strong>{ratio}%</strong>.
      </>
    ),
    en: (
      <>
        <strong>{country.name_en}</strong> ranks{" "}
        <strong>
          {country.rank_projects_evaluated}
          {getOrdinal(country.rank_projects_evaluated, "en")}
        </strong>{" "}
        among countries in terms of the number of evaluated projects (<strong>{country.total_projects_evaluated}</strong>)
        {sameRank ? " as well as " : " and "}
        <strong>
          {country.rank_projects_successful}
          {getOrdinal(country.rank_projects_successful, "en")}
        </strong>{" "}
        in terms of the number of successful projects (<strong>{country.total_projects_successful}</strong>). Its success rate stands at <strong>{ratio}%</strong>.
      </>
    ),
  };
}

export function renderDataTableProjects(data, currentLang: string, selectedCountryCode: string | null) {
  if (!data || data.length === 0) return null;

  const labels = {
    caption: getI18nLabel(i18n, "caption-projects", currentLang),
    position: getI18nLabel(i18n, "position", currentLang),
    country: getI18nLabel(i18n, "country", currentLang),
    evaluated: getI18nLabel(i18n, "evaluated-projects", currentLang),
    rankEvaluated: getI18nLabel(i18n, "rank-evaluated-projects", currentLang),
    successful: getI18nLabel(i18n, "successful-projects", currentLang),
    rankSuccessful: getI18nLabel(i18n, "rank-successful-projects", currentLang),
  };

  return (
    <div className="fr-table fr-table--bordered fr-table--sm">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">{labels.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">{labels.position}</th>
                  <th scope="col">{labels.country}</th>
                  <th scope="col">{labels.evaluated}</th>
                  <th scope="col">{labels.rankEvaluated}</th>
                  <th scope="col">{labels.successful}</th>
                  <th scope="col">{labels.rankSuccessful}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const isSelectedCountry = item.id === selectedCountryCode;
                  return (
                    <tr key={item.id} aria-current={isSelectedCountry ? "true" : undefined}>
                      <th scope="row">{index + 1}</th>
                      <td>{isSelectedCountry ? <strong>{item[`name_${currentLang}`]}</strong> : item[`name_${currentLang}`]}</td>
                      <td>{item.total_projects_evaluated}</td>
                      <td>{item.rank_projects_evaluated}e</td>
                      <td>{item.total_projects_successful}</td>
                      <td>{item.rank_projects_successful}e</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function renderDataTableProjectsSuccessRate(data, currentLang: string, selectedCountryCode: string | null) {
  if (!data || data.length === 0) return null;

  const average = data.reduce((acc, el) => acc + el.ratio_projects, 0) / data.length;

  const labels = {
    caption: getI18nLabel(i18n, "caption-projects-success-rate", currentLang),
    position: getI18nLabel(i18n, "position", currentLang),
    country: getI18nLabel(i18n, "country", currentLang),
    successRate: getI18nLabel(i18n, "success-rate-percent", currentLang),
    vsAverage: getI18nLabel(i18n, "vs-average", currentLang),
    average: currentLang === "fr" ? `Moyenne : ${average.toFixed(1)} %` : `Average: ${average.toFixed(1)} %`,
  };

  return (
    <div className="fr-table fr-table--bordered fr-table--sm">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">{labels.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">{labels.position}</th>
                  <th scope="col">{labels.country}</th>
                  <th scope="col">{labels.successRate}</th>
                  <th scope="col">{labels.vsAverage}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const isSelectedCountry = item.id === selectedCountryCode;
                  const diff = item.ratio_projects - average;
                  return (
                    <tr key={item.id} aria-current={isSelectedCountry ? "true" : undefined}>
                      <th scope="row">{index + 1}</th>
                      <td>{isSelectedCountry ? <strong>{item[`name_${currentLang}`]}</strong> : item[`name_${currentLang}`]}</td>
                      <td>{item.ratio_projects.toFixed(1)} %</td>
                      <td>
                        {diff >= 0 ? "+" : ""}
                        {diff.toFixed(1)} %
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>{labels.average}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
