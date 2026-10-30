import { useSearchParams } from "react-router-dom";

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
        {firstCountry.rank_involved_evaluated === firstCountry.rank_involved_successful ? (
          <>
            Le pays <strong>{firstCountry.name_fr}</strong> arrive en{" "}
            <strong>
              {firstCountry.rank_involved_evaluated}
              {getOrdinal(firstCountry.rank_involved_evaluated, "fr")}
            </strong>{" "}
            position en nombre de candidats (<strong>{firstCountry.total_number_involved_evaluated}</strong>) 
            et de participants (<strong>{firstCountry.total_number_involved_successful}</strong>), soit un taux de succès
            de <strong>{firstCountry.ratio_involved.toFixed(1)}%</strong>.
          </>
        ) : (
          <>
            Le pays <strong>{firstCountry.name_fr}</strong> arrive en{" "}
            <strong>
              {firstCountry.rank_involved_evaluated}
              {getOrdinal(firstCountry.rank_involved_evaluated, "fr")}
            </strong>{" "}
            position en nombre de candidats (<strong>{firstCountry.total_number_involved_evaluated}</strong>) et
            en{" "}
            <strong>
              {firstCountry.rank_involved_successful}
              {getOrdinal(firstCountry.rank_involved_successful, "fr")}
            </strong>{" "}
            position en nombre de participants (<strong>{firstCountry.total_number_involved_successful}</strong>), soit un taux de
            succès de <strong>{firstCountry.ratio_involved.toFixed(1)}%</strong>.
          </>
        )}
      </>
    ),
    en: (
      <>
        {firstCountry.rank_involved_evaluated === firstCountry.rank_involved_successful ? (
          <>
            <strong>{firstCountry.name_en}</strong> ranks{" "}
            <strong>
              {firstCountry.rank_involved_evaluated}
              {getOrdinal(firstCountry.rank_involved_evaluated, "en")}
            </strong>{" "}
            for both the number of applicants (<strong>{firstCountry.total_number_involved_evaluated}</strong>)
            and the number of participants (<strong>{firstCountry.total_number_involved_successful}</strong>), a participant-level success rate
            of <strong>{firstCountry.ratio_involved.toFixed(1)}%</strong>.
          </>
        ) : (
          <>
            <strong>{firstCountry.name_en}</strong> ranks{" "}
            <strong>
              {firstCountry.rank_involved_evaluated}
              {getOrdinal(firstCountry.rank_involved_evaluated, "en")}
            </strong>{" "}
            for the number of applicants (<strong>{firstCountry.total_number_involved_evaluated}</strong>) and{" "}
            <strong>
              {firstCountry.rank_involved_successful}
              {getOrdinal(firstCountry.rank_involved_successful, "en")}
            </strong>{" "}
            for the number of participants (<strong>{firstCountry.total_number_involved_successful}</strong>), a participant-level success rate
            of <strong>{firstCountry.ratio_involved.toFixed(1)}%</strong>.
          </>
        )}
      </>
    ),
  };
}

export function renderDataTableParticipations(data, currentLang, selectedCountryCode) {
  // TODO: error with require "Cannot find name 'require'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node` and then add 'node' to the types field in your tsconfig."
  const { getI18nLabel } = require("../../../../../../../utils");
  const i18n = require("../../../../../i18n-global.json");
  
  if (!data || data.length === 0) return null;

  const labels = {
    caption: getI18nLabel(i18n, "caption-funding-ranking-subsidies"),
    position: getI18nLabel(i18n, "position"),
    country: getI18nLabel(i18n, "country"),
    candidats: getI18nLabel(i18n, "candidates"),
    rankCandidats: getI18nLabel(i18n, "rank-candidates"),
    participants: getI18nLabel(i18n, "participants"),
    rankParticipants: getI18nLabel(i18n, "rank-participants"),
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
                    {labels.candidats}
                  </th>
                  <th scope="col" style={{ textAlign: "right" }}>
                    {labels.rankCandidats}
                  </th>
                  <th scope="col" style={{ textAlign: "right" }}>
                    {labels.participants}
                  </th>
                  <th scope="col" style={{ textAlign: "right" }}>
                    {labels.rankParticipants}
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
                      <td style={{ textAlign: "right" }}>{item.total_number_involved_evaluated}</td>
                      <td style={{ textAlign: "right" }}>{item.rank_involved_evaluated}e</td>
                      <td style={{ textAlign: "right" }}>{item.total_number_involved_successful}</td>
                      <td style={{ textAlign: "right" }}>{item.rank_involved_successful}e</td>
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

export function renderDataTableParticipationsSuccessRate(data, currentLang, selectedCountryCode) {
  const { getI18nLabel } = require("../../../../../../../utils");
  const i18n = require("../../../../../i18n-global.json");
  
  if (!data || data.length === 0) return null;

  // Calculer le taux moyen
  const total = data.reduce((acc, el) => acc + el.ratio_involved, 0);
  const average = total / data.length;

  const labels = {
    caption: getI18nLabel(i18n, "caption-participants-success-rate"),
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
                  const diff = item.ratio_involved - average;
                  const diffSign = diff >= 0 ? "+" : "";

                  return (
                    <tr
                      key={item.id}
                      style={isSelectedCountry ? { fontWeight: "bold" } : undefined}
                      aria-current={isSelectedCountry ? "true" : undefined}
                    >
                      <th scope="row">{index + 1}</th>
                      <td>{countryName}</td>
                      <td style={{ textAlign: "right" }}>{item.ratio_involved.toFixed(1)} %</td>
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
