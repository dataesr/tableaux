import { getI18nLabel } from "../../../../../../utils";
import { formatToMillions, formatToRates } from "../../../../../../utils/format";
import i18n from "../../../../i18n-global.json";

export function successRatesReadingKey(data, displayType, currentLang) {
  const dataSelectedCountry = data?.filter((item) => item.country !== "all")[0];
  const year = dataSelectedCountry?.data[0]?.topics[0]?.years[0]?.year || "2021";
  const topics = dataSelectedCountry?.data[0]?.topics || [];

  // Récupération des données pour le calcul des pourcentages
  const dataGlobal = data?.filter((item) => item.country === "all")[0];

  // On prend le premier topic pour le readingKey (ou on pourrait agréger)
  const firstTopic = topics[0];
  const topicName = currentLang === "fr" ? firstTopic?.thema_name_fr : firstTopic?.thema_name_en;

  const dataYearEvaluated = dataSelectedCountry?.data?.find((d) => d.stage === "evaluated")?.topics[0]?.years?.find((y) => y.year === year);
  const dataYearSuccessful = dataSelectedCountry?.data?.find((d) => d.stage === "successful")?.topics[0]?.years?.find((y) => y.year === year);
  const dataYearEvaluatedGlobal = dataGlobal?.data?.find((d) => d.stage === "evaluated")?.topics[0]?.years?.find((y) => y.year === year);
  const dataYearSuccessfulGlobal = dataGlobal?.data?.find((d) => d.stage === "successful")?.topics[0]?.years?.find((y) => y.year === year);

  let fr;
  let en;

  switch (displayType) {
    case "total_coordination_number": {
      const evaluatedCountryCoordination = dataYearEvaluated?.total_coordination_number || 0;
      const successfulCountryCoordination = dataYearSuccessful?.total_coordination_number || 0;
      const evaluatedGlobalCoordination = dataYearEvaluatedGlobal?.total_coordination_number || 1;
      const successfulGlobalCoordination = dataYearSuccessfulGlobal?.total_coordination_number || 1;

      const pct1Coordination = evaluatedCountryCoordination / evaluatedGlobalCoordination;
      const pct2Coordination = successfulCountryCoordination / successfulGlobalCoordination;

      fr = (
        <>
          En <strong>{year}</strong>, la part de coordinations des projets évalués pour la thématique <strong>{topicName}</strong> est de{" "}
          <strong>{formatToRates(pct1Coordination)}</strong> tandis que la part des coordinations des projets lauréats pour la même année est de{" "}
          <strong>{formatToRates(pct2Coordination)}</strong>.
        </>
      );
      en = (
        <>
          In <strong>{year}</strong>, the share of coordinations for evaluated projects for the <strong>{topicName}</strong> topic is{" "}
          <strong>{formatToRates(pct1Coordination)}</strong>, while the share of coordinations for successful projects for the same year is{" "}
          <strong>{formatToRates(pct2Coordination)}</strong>.
        </>
      );
      break;
    }

    case "total_number_involved": {
      const evaluatedCountryInvolved = dataYearEvaluated?.total_number_involved || 0;
      const successfulCountryInvolved = dataYearSuccessful?.total_number_involved || 0;
      const evaluatedGlobalInvolved = dataYearEvaluatedGlobal?.total_number_involved || 1;
      const successfulGlobalInvolved = dataYearSuccessfulGlobal?.total_number_involved || 1;

      const pct1Involved = evaluatedCountryInvolved / evaluatedGlobalInvolved;
      const pct2Involved = successfulCountryInvolved / successfulGlobalInvolved;

      fr = (
        <>
          En <strong>{year}</strong>, la part de participants sur les projets évalués pour la thématique <strong>{topicName}</strong> est de{" "}
          <strong>{formatToRates(pct1Involved)}</strong> tandis que la part des participants sur les projets lauréats pour la même année est de{" "}
          <strong>{formatToRates(pct2Involved)}</strong>.
        </>
      );
      en = (
        <>
          In <strong>{year}</strong>, the share of participants for evaluated projects for the <strong>{topicName}</strong> topic is{" "}
          <strong>{formatToRates(pct1Involved)}</strong>, while the share of participants for successful projects for the same year is{" "}
          <strong>{formatToRates(pct2Involved)}</strong>.
        </>
      );
      break;
    }

    default: {
      const evaluatedCountryFunding = dataYearEvaluated?.total_fund_eur || 0;
      const evaluatedGlobalFunding = dataYearEvaluatedGlobal?.total_fund_eur || 1;
      const successfulCountryFunding = dataYearSuccessful?.total_fund_eur || 0;
      const successfulGlobalFunding = dataYearSuccessfulGlobal?.total_fund_eur || 1;

      const pct1 = evaluatedCountryFunding / evaluatedGlobalFunding;
      const pct2 = successfulCountryFunding / successfulGlobalFunding;

      fr = (
        <>
          En <strong>{year}</strong>, la part de subventions des projets évalués pour la thématique <strong>{topicName}</strong> est de{" "}
          <strong>{formatToRates(pct1)}</strong> tandis que la part des subventions des projets lauréats pour la même année est de{" "}
          <strong>{formatToRates(pct2)}</strong>.
        </>
      );
      en = (
        <>
          In <strong>{year}</strong>, the share of funding for evaluated projects for the <strong>{topicName}</strong> topic is{" "}
          <strong>{formatToRates(pct1)}</strong>, while the share of funding for successful projects for the same year is{" "}
          <strong>{formatToRates(pct2)}</strong>.
        </>
      );
    }
  }

  return {
    fr: fr,
    en: en,
  };
}

export function valuesSuccessReadingKey(data, displayType) {
  const dataSelectedCountry = data?.filter((item) => item.country !== "all")[0];
  const year = dataSelectedCountry?.data[0]?.topics[0]?.years[0]?.year || "2021";

  const dataYearEvaluated = dataSelectedCountry?.data?.find((d) => d.stage === "evaluated")?.topics[0]?.years?.find((y) => y.year === year);
  const dataYearSuccessful = dataSelectedCountry?.data?.find((d) => d.stage === "successful")?.topics[0]?.years?.find((y) => y.year === year);
  // funding
  const evaluatedFunding = dataYearEvaluated?.total_fund_eur || 0;
  const successfulFunding = dataYearSuccessful?.total_fund_eur || 0;
  const successRate = evaluatedFunding > 0 ? successfulFunding / evaluatedFunding : 0;
  // coordinations
  const evaluatedTotalCoordinationNumber = dataYearEvaluated?.total_coordination_number || 0;
  const successfulTotalCoordinationNumber = dataYearSuccessful?.total_coordination_number || 0;
  const totalCoordinationNumberSuccessRate =
    evaluatedTotalCoordinationNumber > 0 ? successfulTotalCoordinationNumber / evaluatedTotalCoordinationNumber : 0;
  // involved
  const evaluatedTotalNumberInvolved = dataYearEvaluated?.total_number_involved || 0;
  const successfulTotalNumberInvolved = dataYearSuccessful?.total_number_involved || 0;
  const totalNumberInvolvedSuccessRate = evaluatedTotalNumberInvolved > 0 ? successfulTotalNumberInvolved / evaluatedTotalNumberInvolved : 0;

  let fr;
  let en;

  switch (displayType) {
    case "total_coordination_number":
      fr = (
        <>
          En <strong>{year}</strong>, le nombre de coordinations sur les projets évalués est de <strong>{evaluatedTotalCoordinationNumber}</strong>{" "}
          alors que sur les projets lauréats, celles-ci sont de <strong>{successfulTotalCoordinationNumber}</strong>. Cela représente un taux de
          succès de <strong>{formatToRates(totalCoordinationNumberSuccessRate)}</strong>.
        </>
      );
      en = (
        <>
          In <strong>{year}</strong>, the number of coordinations for evaluated projects is <strong>{evaluatedTotalCoordinationNumber}</strong>, while
          for successful projects, it is <strong>{successfulTotalCoordinationNumber}</strong>. This represents a success rate of{" "}
          <strong>{formatToRates(totalCoordinationNumberSuccessRate)}</strong>.
        </>
      );
      break;

    case "total_number_involved":
      fr = (
        <>
          En <strong>{year}</strong>, le nombre total de participants sur les projets évalués s'élèvent à{" "}
          <strong>{evaluatedTotalNumberInvolved}</strong> alors que sur les projets lauréats, celui-ci est de{" "}
          <strong>{successfulTotalNumberInvolved}</strong>. Cela représente un taux de succès de{" "}
          <strong>{formatToRates(totalNumberInvolvedSuccessRate)}</strong>.
        </>
      );
      en = (
        <>
          In <strong>{year}</strong>, the total number of participants for evaluated projects amounts to{" "}
          <strong>{evaluatedTotalNumberInvolved}</strong>, while for successful projects, it amounts to{" "}
          <strong>{successfulTotalNumberInvolved}</strong>. This represents a success rate of{" "}
          <strong>{formatToRates(totalNumberInvolvedSuccessRate)}</strong>.
        </>
      );
      break;

    default:
      fr = (
        <>
          En <strong>{year}</strong>, les subventions sur les projets évalués s'élèvent à <strong>{formatToMillions(evaluatedFunding)}</strong> alors
          que sur les projets lauréats, celles-ci sont de <strong>{formatToMillions(successfulFunding)}</strong>. Cela représente un taux de succès de{" "}
          <strong>{formatToRates(successRate)}</strong>.
        </>
      );
      en = (
        <>
          In <strong>{year}</strong>, the funding for evaluated projects amounts to <strong>{formatToMillions(evaluatedFunding)}</strong>, while for
          successful projects, it amounts to <strong>{formatToMillions(successfulFunding)}</strong>. This represents a success rate of{" "}
          <strong>{formatToRates(successRate)}</strong>.
        </>
      );
  }

  return {
    fr: fr,
    en: en,
  };
}

export function renderDataTable(data, currentLang, displayType) {
  if (!data || !Array.isArray(data)) return null;

  const countryData = data.filter((item) => item.country !== "all")[0];
  if (!countryData?.data) return null;

  const filteredData = countryData.data;
  const evaluatedData = filteredData.find((item) => item.stage === "evaluated");
  const successfulData = filteredData.find((item) => item.stage === "successful");

  if (!evaluatedData?.topics?.length || !successfulData?.topics?.length) return null;

  const years = new Set();
  evaluatedData.topics[0].years.forEach((year) => years.add(year.year));
  const sortedYears = Array.from(years).sort();

  const labels = {
    caption: getI18nLabel(i18n, "caption-topic-evolution"),
    topic: getI18nLabel(i18n, "topic"),
    evaluated: getI18nLabel(i18n, "evaluated-simple"),
    successful: getI18nLabel(i18n, "successful"),
    successRate: getI18nLabel(i18n, "success-rate"),
  };

  const formatValue = (value: number) => {
    if (displayType === "total_fund_eur") {
      return formatToMillions(value);
    }
    return value.toLocaleString(currentLang === "fr" ? "fr-FR" : "en-US");
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
                  <th scope="col" rowSpan={2}>
                    {labels.topic}
                  </th>
                  {sortedYears.map((year) => (
                    <th key={`year-${year}`} scope="col" colSpan={3} style={{ textAlign: "center" }}>
                      {String(year)}
                    </th>
                  ))}
                </tr>
                <tr>
                  {sortedYears.map((year) => (
                    <>
                      <th key={`eval-${year}`} scope="col">
                        {labels.evaluated}
                      </th>
                      <th key={`succ-${year}`} scope="col">
                        {labels.successful}
                      </th>
                      <th key={`rate-${year}`} scope="col">
                        {labels.successRate}
                      </th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evaluatedData.topics.map((topic) => {
                  const topicName = currentLang === "fr" ? topic.thema_name_fr : topic.thema_name_en;
                  const successfulTopic = successfulData.topics.find((t) => t.thema_code === topic.thema_code);

                  return (
                    <tr key={topic.thema_code}>
                      <th scope="row">{topicName}</th>
                      {sortedYears.map((year) => {
                        const evaluatedYearData = topic.years.find((y) => y.year === year);
                        const successfulYearData = successfulTopic?.years.find((y) => y.year === year);

                        const evaluatedValue = evaluatedYearData ? evaluatedYearData[displayType] : 0;
                        const successfulValue = successfulYearData ? successfulYearData[displayType] : 0;
                        const successRate = evaluatedValue > 0 ? ((successfulValue / evaluatedValue) * 100).toFixed(1) : "0.0";

                        return (
                          <>
                            <td key={`eval-${year}-${topic.thema_code}`}>{formatValue(evaluatedValue)}</td>
                            <td key={`succ-${year}-${topic.thema_code}`}>{formatValue(successfulValue)}</td>
                            <td key={`rate-${year}-${topic.thema_code}`}>{successRate} %</td>
                          </>
                        );
                      })}
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

export function renderDataTableRates(data, currentLang, displayType) {
  if (!data || !Array.isArray(data)) return null;

  const countryData = data.filter((item) => item.country !== "all")[0];
  const allCountryData = data.find((item) => item.country === "all");

  if (!countryData?.data || !allCountryData?.data) return null;

  const filteredData = countryData.data;
  const allData = allCountryData.data;
  const evaluatedData = filteredData.find((item) => item.stage === "evaluated");
  const successfulData = filteredData.find((item) => item.stage === "successful");
  const evaluatedAllData = allData.find((item) => item.stage === "evaluated");
  const successfulAllData = allData.find((item) => item.stage === "successful");

  if (!evaluatedData?.topics?.length || !successfulData?.topics?.length) return null;
  if (!evaluatedAllData?.topics?.length || !successfulAllData?.topics?.length) return null;

  const years = new Set();
  evaluatedData.topics[0].years.forEach((year) => years.add(year.year));
  const sortedYears = Array.from(years).sort();

  const labels = {
    caption: getI18nLabel(i18n, "caption-topic-proportion-participants"),
    topic: getI18nLabel(i18n, "topic"),
    evaluated: getI18nLabel(i18n, "projects-evaluated"),
    successful: getI18nLabel(i18n, "projects-successful"),
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
                  <th scope="col" rowSpan={2}>
                    {labels.topic}
                  </th>
                  <th scope="col" colSpan={sortedYears.length} style={{ textAlign: "center" }}>
                    {labels.evaluated}
                  </th>
                  <th scope="col" colSpan={sortedYears.length} style={{ textAlign: "center" }}>
                    {labels.successful}
                  </th>
                </tr>
                <tr>
                  {sortedYears.map((year) => (
                    <th key={`eval-${year}`} scope="col">
                      {String(year)}
                    </th>
                  ))}
                  {sortedYears.map((year) => (
                    <th key={`succ-${year}`} scope="col">
                      {String(year)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evaluatedData.topics.map((topic) => {
                  const topicName = currentLang === "fr" ? topic.thema_name_fr : topic.thema_name_en;
                  const successfulTopic = successfulData.topics.find((t) => t.thema_code === topic.thema_code);
                  const evaluatedAllTopic = evaluatedAllData.topics.find((t) => t.thema_code === topic.thema_code);
                  const successfulAllTopic = successfulAllData.topics.find((t) => t.thema_code === topic.thema_code);

                  return (
                    <tr key={topic.thema_code}>
                      <th scope="row">{topicName}</th>
                      {/* Projets évalués */}
                      {sortedYears.map((year, index) => {
                        const yearData = topic.years.find((y) => y.year === year);
                        const allYearData = evaluatedAllTopic?.years[index];
                        const countryValue = yearData ? yearData[displayType] : 0;
                        const totalValue = allYearData ? allYearData[displayType] : 1;
                        const percentage = totalValue > 0 ? ((countryValue / totalValue) * 100).toFixed(1) : "0.0";

                        return <td key={`eval-${year}-${topic.thema_code}`}>{percentage} %</td>;
                      })}
                      {/* Projets lauréats */}
                      {sortedYears.map((year, index) => {
                        const yearData = successfulTopic?.years.find((y) => y.year === year);
                        const allYearData = successfulAllTopic?.years[index];
                        const countryValue = yearData ? yearData[displayType] : 0;
                        const totalValue = allYearData ? allYearData[displayType] : 1;
                        const percentage = totalValue > 0 ? ((countryValue / totalValue) * 100).toFixed(1) : "0.0";

                        return <td key={`succ-${year}-${topic.thema_code}`}>{percentage} %</td>;
                      })}
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
