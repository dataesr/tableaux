import { useSearchParams } from "react-router-dom";

import { isEjoParam } from "../../../../../utils/params";
import { getI18nLabel } from "../../../../../../../utils";

import { getCountryNameWithArticle } from "../../../../../utils/country-mapping";
import i18n from "../../../../../i18n-global.json";
import { formatToPercentLang } from "../../../../../../../utils/format";

export function useGetParams() {
  const [searchParams] = useSearchParams();

  const params: string[] = [];

  // Récupérer le paramètre country_code s'il existe
  const countryCode = searchParams.get("country_code");
  if (countryCode) {
    params.push(`country_code=${countryCode}`);
  }

  // Récupérer le paramètre pillarId et l'ajouter comme pillars s'il existe
  const pillarId = searchParams.get("pillarId");
  if (pillarId) {
    params.push(`pillars=${pillarId}`);
  }

  // Récupérer le paramètre programId et l'ajouter comme programs s'il existe
  const programId = searchParams.get("programId");
  if (programId) {
    params.push(`programs=${programId}`);
  }

  // Récupérer le paramètre thematicIds et l'ajouter comme thematics s'il existe
  const thematicIds = searchParams.get("thematicIds");
  if (thematicIds) {
    params.push(`thematics=${thematicIds}`);
  }

  // Récupérer le paramètre destinationIds et l'ajouter comme destinations s'il existe
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

  const currentLang = (searchParams.get("language") === "en" ? "en" : "fr") as "fr" | "en";

  return { currentLang, params: params.filter((item) => !!item).join("&") };
}

export function readingKey(data, currentLang) {
  if (!data || data.length === 0) {
    return {
      fr: <></>,
      en: <></>,
    };
  }
  console.log(data)
  // Trouver les pays avec les parts les plus élevées
  const topEvaluated = [...data].sort((a, b) => b.total_evaluated_ratio - a.total_evaluated_ratio)[0];
  const topSuccessful = [...data].sort((a, b) => b.total_successful_ratio - a.total_successful_ratio)[0];
  const countryN = getCountryNameWithArticle(topEvaluated?.id, currentLang);


  return {
    fr: (
      <>
        {countryN} concentre{" "}
        <strong>{formatToPercentLang(topEvaluated.total_evaluated_ratio, currentLang)}</strong> des financements demandés{" "}
        <strong>{formatToPercentLang(topSuccessful.total_successful_ratio, currentLang)}</strong> des financements alloués.
      </>
    ),
    en: (
      <>
        {countryN} accounts for{" "}
        <strong>{formatToPercentLang(topEvaluated.total_evaluated_ratio, currentLang)}</strong> of funding requested and{" "}
        <strong>{formatToPercentLang(topSuccessful.total_successful_ratio, currentLang)}</strong> of funding awarded.
      </>
    ),
  };
}

export function renderDataTable(data, currentLang, selectedCountryCode) {
  if (!data || data.length === 0) return null;

  const labels = {
    caption: getI18nLabel(i18n, "caption-funding-ranking-rates"),
    position: getI18nLabel(i18n, "position"),
    country: getI18nLabel(i18n, "country"),
    ratioEvaluated: getI18nLabel(i18n, "share-requested-percent"),
    rankEvaluated: getI18nLabel(i18n, "rank-requested"),
    ratioSuccessful: getI18nLabel(i18n, "share-obtained-percent"),
    rankSuccessful: getI18nLabel(i18n, "rank-obtained"),
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
                  <th scope="col" style={{ textAlign: "right" }}>
                    {labels.ratioEvaluated}
                  </th>
                  <th scope="col" style={{ textAlign: "right" }}>
                    {labels.rankEvaluated}
                  </th>
                  <th scope="col" style={{ textAlign: "right" }}>
                    {labels.ratioSuccessful}
                  </th>
                  <th scope="col" style={{ textAlign: "right" }}>
                    {labels.rankSuccessful}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const countryName = currentLang === "fr" ? item.name_fr : item.name_en;
                  const isSelectedCountry = item.id === selectedCountryCode;

                  return (
                    <tr
                      key={item.id}
                      style={isSelectedCountry ? { fontWeight: "bold" } : undefined}
                      aria-current={isSelectedCountry ? "true" : undefined}
                    >
                      <th scope="row">{index + 1}</th>
                      <td>{countryName}</td>
                      <td style={{ textAlign: "right" }}>{item.total_evaluated_ratio} %</td>
                      <td style={{ textAlign: "right" }}>{item.rank_evaluated}e</td>
                      <td style={{ textAlign: "right" }}>{item.total_successful_ratio} %</td>
                      <td style={{ textAlign: "right" }}>{item.rank_successful}e</td>
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
