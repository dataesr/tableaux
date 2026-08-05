import { useSearchParams } from "react-router-dom";
import { getI18nLabel } from "../../../../../../../utils";
import i18n from "../../../../../i18n-global.json";
  
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

  return params.join("&");
}

export function readingKey(data) {
  if (!data || data.length === 0) {
    return {
      fr: <></>,
      en: <></>,
    };
  }

  // Prendre le premier pays de la liste
  const firstCountry = data[0];

  // Fonction pour obtenir le suffixe ordinal
  const getOrdinal = (rank, lang) => {
    if (lang === "fr") {
      return rank === 1 ? "ère" : "ème";
    }
    if (rank === 1) return "st";
    if (rank === 2) return "nd";
    if (rank === 3) return "rd";
    return "th";
  };

  return {
    fr: (
      <>
        {firstCountry.rank_coordination_number_evaluated === firstCountry.rank_coordination_number_successful ? (
          <>
            Le pays "<strong>{firstCountry.name_fr}</strong>" arrive en{" "}
            <strong>
              {firstCountry.rank_coordination_number_evaluated}
              {getOrdinal(firstCountry.rank_coordination_number_evaluated, "fr")}
            </strong>{" "}
            position pour le nombre de coordinations évaluées (<strong>{firstCountry.total_coordination_number_evaluated}</strong>) ainsi que pour les coordinations réussies (<strong>{firstCountry.total_coordination_number_successful}</strong>). Son
            taux de succès est de <strong>{firstCountry?.ratio_coordination_number?.toFixed(1)}%</strong>.
          </>
        ) : (
          <>
            Le pays "<strong>{firstCountry.name_fr}</strong>" arrive en{" "}
            <strong>
              {firstCountry.rank_coordination_number_evaluated}
              {getOrdinal(firstCountry.rank_coordination_number_evaluated, "fr")}
            </strong>{" "}
            position pour le nombre de coordinations évaluées (<strong>{firstCountry.total_coordination_number_evaluated}</strong>) alors qu'il arrive en{" "}
            <strong>
              {firstCountry.rank_coordination_number_successful}
              {getOrdinal(firstCountry.rank_coordination_number_successful, "fr")}
            </strong>{" "}
            position pour les coordinations réussies (<strong>{firstCountry.total_coordination_number_successful}</strong>). Le taux de succès est de <strong>{firstCountry?.ratio_coordination_number?.toFixed(1)}%</strong>.
          </>
        )}
      </>
    ),
    en: (
      <>
        {firstCountry.rank_coordination_number_evaluated === firstCountry.rank_coordination_number_successful ? (
          <>
            The country "<strong>{firstCountry.name_en}</strong>" ranks{" "}
            <strong>
              {firstCountry.rank_coordination_number_evaluated}
              {getOrdinal(firstCountry.rank_coordination_number_evaluated, "en")}
            </strong>{" "}
            for the number of evaluated coordinations (<strong>{firstCountry.total_coordination_number_evaluated}</strong>) as well as for successful coordinations (<strong>{firstCountry.total_coordination_number_successful}</strong>). Its success
            rate is <strong>{firstCountry?.ratio_coordination_number?.toFixed(1)}%</strong>.
          </>
        ) : (
          <>
            The country "<strong>{firstCountry.name_en}</strong>" ranks{" "}
            <strong>
              {firstCountry.rank_coordination_number_evaluated}
              {getOrdinal(firstCountry.rank_coordination_number_evaluated, "en")}
            </strong>{" "}
            for the number of evaluated coordinations (<strong>{firstCountry?.total_coordination_number_evaluated}</strong>) while it ranks{" "}
            <strong>
              {firstCountry.rank_coordination_number_successful}
              {getOrdinal(firstCountry?.rank_coordination_number_successful, "en")}
            </strong>{" "}
            for successful coordinations (<strong>{firstCountry?.total_coordination_number_successful}</strong>). The success rate is <strong>{firstCountry?.ratio_coordination_number?.toFixed(1)}%</strong>.
          </>
        )}
      </>
    ),
  };
}

export function renderDataTableCoordination(data, currentLang, selectedCountryCode) {
  if (!data || data.length === 0) return null;

  const labels = {
    caption: getI18nLabel(i18n, "caption-funding-ranking-subsidies"),
    position: getI18nLabel(i18n, "position"),
    country: getI18nLabel(i18n, "country"),
    coordEvaluated: getI18nLabel(i18n, "submitted-coordinations"),
    rankEvaluated: getI18nLabel(i18n, "rank-requested"),
    coordSuccessful: getI18nLabel(i18n, "coordinations-coordinator"),
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
                    {labels.coordEvaluated}
                  </th>
                  <th scope="col" style={{ textAlign: "right" }}>
                    {labels.rankEvaluated}
                  </th>
                  <th scope="col" style={{ textAlign: "right" }}>
                    {labels.coordSuccessful}
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
                    <tr key={item.id} style={isSelectedCountry ? { fontWeight: "bold" } : undefined} aria-current={isSelectedCountry ? "true" : undefined}>
                      <th scope="row">{index + 1}</th>
                      <td>{countryName}</td>
                      <td style={{ textAlign: "right" }}>{item.total_coordination_number_evaluated}</td>
                      <td style={{ textAlign: "right" }}>{item.rank_coordination_number_evaluated}e</td>
                      <td style={{ textAlign: "right" }}>{item.total_coordination_number_successful}</td>
                      <td style={{ textAlign: "right" }}>{item.rank_coordination_number_successful}e</td>
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

export function renderDataTableCoordinationSuccessRate(data, currentLang, selectedCountryCode) {
  if (!data || data.length === 0) return null;
  // Calculer le taux moyen
  const total = data.reduce((acc, el) => acc + el.ratio_coordination_number, 0);
  const average = total / data.length;

  const labels = {
    caption: getI18nLabel(i18n, "caption-success-rate-by-country"),
    position: getI18nLabel(i18n, "position"),
    country: getI18nLabel(i18n, "country"),
    successRate: getI18nLabel(i18n, "success-rate-percent"),
    vsAverage: getI18nLabel(i18n, "vs-average"),
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
                  <th scope="col" style={{ textAlign: "right" }}>
                    {labels.successRate}
                  </th>
                  <th scope="col" style={{ textAlign: "right" }}>
                    {labels.vsAverage}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const countryName = currentLang === "fr" ? item.name_fr : item.name_en;
                  const isSelectedCountry = item.id === selectedCountryCode;
                  const diff = item.ratio_coordination_number - average;
                  const diffSign = diff >= 0 ? "+" : "";

                  return (
                    <tr key={item.id} style={isSelectedCountry ? { fontWeight: "bold" } : undefined} aria-current={isSelectedCountry ? "true" : undefined}>
                      <th scope="row">{index + 1}</th>
                      <td>{countryName}</td>
                      <td style={{ textAlign: "right" }}>{item.ratio_coordination_number.toFixed(1)} %</td>
                      <td style={{ textAlign: "right" }}>
                        {diffSign}
                        {diff.toFixed(1)} %
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", fontStyle: "italic" }}>
                    {labels.average}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
