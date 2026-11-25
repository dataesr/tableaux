import { useSearchParams } from "react-router-dom";

import { getI18nLabel } from "../../../../../../utils";
import { formatToMillions, formatToPercentLang, formatNumberLang, formatCurrencyLang } from "../../../../../../utils/format";
import i18n from "../../../../i18n-global.json";
import { getEvolReadingKey, getItemName, getLevelFromData, LEVELS } from "../../evol-charts-text";
import { isEjoParam } from "../../../../utils/params";
import { getCountryNameWithArticle } from "../../../../utils/country-mapping";
import { getCountryAdjectives } from "../../../../../../components/country-selector/utils.jsx";

export function useGetParams() {
  const [searchParams] = useSearchParams();

  const params: string[] = [];

  // Récupérer le paramètre country_code s'il existe
  const countryCode = searchParams.get("country_code");
  if (countryCode) {
    params.push(`country_code=${countryCode}`);
  }

  const rangeOfYears = searchParams.get("range_of_years");
  if (rangeOfYears) {
    params.push(`range_of_years=${rangeOfYears}`);
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

  const thematicIds = searchParams.get("thematicIds");
  if (thematicIds) {
    params.push(`thematicIds=${thematicIds}`);
  }

  const destinationIds = searchParams.get("destinationIds");
  if (destinationIds) {
    params.push(`destinationIds=${destinationIds}`);
  }

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }

  const currentLang = (searchParams.get("language") === "en" ? "en" : "fr") as "fr" | "en";
  const code = countryCode || "FRA";
  const countryN = getCountryNameWithArticle(code, currentLang).replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase());

  const countryAdj = getCountryAdjectives(code, currentLang);
  // Pluriel seulement en français
  const adjMascPlural =
  currentLang === "fr" && !countryAdj.m.endsWith("s") ? `${countryAdj.m}s` : countryAdj.m;

  return { currentLang, countryN, adjMascPlural, params: params.filter((item) => !!item).join("&") };
}

// Liste triée de toutes les années de tous les items (plusieurs thématiques possibles, années pas forcément identiques)
function getSortedYears(stageData, itemsKey) {
  const years = new Set();
  (stageData?.[itemsKey] || []).forEach((item) => item.years.forEach((y) => years.add(y.year)));
  return Array.from(years).sort();
}

export function successRatesReadingKey(data, displayType, currentLang, countryN, adjMascPlural) {
  const level = getLevelFromData(data);
  const { itemsKey, codeKey } = LEVELS[level];
  const dataSelectedCountry = data?.filter((item) => item.country !== "all")[0];

  // Récupération des données pour le calcul des pourcentages
  const dataGlobal = data?.filter((item) => item.country === "all")[0];

  // Plusieurs thématiques possibles : on prend le premier item pour le readingKey
  // et on retrouve le même item (par son code) dans les autres jeux de données
  const firstItem = dataSelectedCountry?.data?.find((d) => d.stage === "evaluated")?.[itemsKey]?.[0];
  const year = firstItem?.years[0]?.year || "2021";
  const level_name_fr = getItemName(firstItem, level, "fr");
  const level_name_en = getItemName(firstItem, level, "en");

  const findYearData = (scopeData, stage) =>
    scopeData?.data?.find((d) => d.stage === stage)?.[itemsKey]?.find((i) => i[codeKey] === firstItem?.[codeKey])?.years?.find((y) => y.year === year);

  const dataYearEvaluated = findYearData(dataSelectedCountry, "evaluated");
  const dataYearSuccessful = findYearData(dataSelectedCountry, "successful");
  const dataYearEvaluatedGlobal = findYearData(dataGlobal, "evaluated");
  const dataYearSuccessfulGlobal = findYearData(dataGlobal, "successful");

  // Calcul des pourcentages (pays sélectionné / ensemble des pays) en %
  const pct1 = ((dataYearEvaluated?.[displayType] || 0) / (dataYearEvaluatedGlobal?.[displayType] || 1)) * 100;
  const pct2 = ((dataYearSuccessful?.[displayType] || 0) / (dataYearSuccessfulGlobal?.[displayType] || 1)) * 100;

  return getEvolReadingKey({
    chart: "rates",
    displayType,
    level,
    levelName: { fr: level_name_fr, en: level_name_en },
    countryN,
    adjMascPlural,
    year,
    evaluated: formatToPercentLang(pct1, currentLang),
    successful: formatToPercentLang(pct2, currentLang),
  });
}

export function valuesSuccessReadingKey(data, displayType, currentLang, countryN, adjMascPlural) {
  const level = getLevelFromData(data);
  const { itemsKey, codeKey } = LEVELS[level];
  const dataSelectedCountry = data?.filter((item) => item.country !== "all")[0];

  // Plusieurs thématiques possibles : on prend le premier item pour le readingKey
  const firstItem = dataSelectedCountry?.data?.find((d) => d.stage === "evaluated")?.[itemsKey]?.[0];
  const year = firstItem?.years[0]?.year || "2021";
  const level_name_fr = getItemName(firstItem, level, "fr");
  const level_name_en = getItemName(firstItem, level, "en");

  const findYearData = (stage) =>
    dataSelectedCountry?.data?.find((d) => d.stage === stage)?.[itemsKey]?.find((i) => i[codeKey] === firstItem?.[codeKey])?.years?.find((y) => y.year === year);

  const dataYearEvaluated = findYearData("evaluated");
  const dataYearSuccessful = findYearData("successful");

  const evaluatedValue = dataYearEvaluated?.[displayType] || 0;
  const successfulValue = dataYearSuccessful?.[displayType] || 0;
  // Taux de succès en %
  const successRate = evaluatedValue > 0 ? (successfulValue / evaluatedValue) * 100 : 0;

  const formatValue = (value: number) =>
    displayType === "total_fund_eur" ? formatCurrencyLang(value, currentLang) : formatNumberLang(value, currentLang);

  return getEvolReadingKey({
    chart: "values",
    displayType,
    level,
    levelName: { fr: level_name_fr, en: level_name_en },
    countryN,
    adjMascPlural,
    year,
    evaluated: formatValue(evaluatedValue),
    successful: formatValue(successfulValue),
    rate: formatToPercentLang(successRate, currentLang),
  });
}

export function renderDataTable(data, currentLang, displayType) {
  if (!data || !Array.isArray(data)) return null;

  const level = getLevelFromData(data);
  const { itemsKey, codeKey } = LEVELS[level];

  const countryData = data.filter((item) => item.country !== "all")[0];
  if (!countryData?.data) return null;

  const filteredData = countryData.data;
  const evaluatedData = filteredData.find((item) => item.stage === "evaluated");
  const successfulData = filteredData.find((item) => item.stage === "successful");

  if (!evaluatedData?.[itemsKey]?.length || !successfulData?.[itemsKey]?.length) return null;

  const sortedYears = getSortedYears(evaluatedData, itemsKey);

  const labels = {
    caption: getI18nLabel(i18n, `caption-${level}-evolution`),
    level: getI18nLabel(i18n, level),
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
                    {labels.level}
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
                {evaluatedData[itemsKey].map((item) => {
                  const itemName = getItemName(item, level, currentLang);
                  const successfulItem = successfulData[itemsKey].find((s) => s[codeKey] === item[codeKey]);

                  return (
                    <tr key={item[codeKey]}>
                      <th scope="row">{itemName}</th>
                      {sortedYears.map((year) => {
                        const evaluatedYearData = item.years.find((y) => y.year === year);
                        const successfulYearData = successfulItem?.years.find((y) => y.year === year);

                        const evaluatedValue = evaluatedYearData ? evaluatedYearData[displayType] : 0;
                        const successfulValue = successfulYearData ? successfulYearData[displayType] : 0;
                        const successRate = evaluatedValue > 0 ? (successfulValue / evaluatedValue) * 100 : 0;

                        return (
                          <>
                            <td key={`eval-${year}-${item[codeKey]}`}>{formatValue(evaluatedValue)}</td>
                            <td key={`succ-${year}-${item[codeKey]}`}>{formatValue(successfulValue)}</td>
                            <td key={`rate-${year}-${item[codeKey]}`}>{formatToPercentLang(successRate, currentLang)}</td>
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

  const level = getLevelFromData(data);
  const { itemsKey, codeKey } = LEVELS[level];

  const countryData = data.filter((item) => item.country !== "all")[0];
  const allCountryData = data.find((item) => item.country === "all");

  if (!countryData?.data || !allCountryData?.data) return null;

  const filteredData = countryData.data;
  const allData = allCountryData.data;
  const evaluatedData = filteredData.find((item) => item.stage === "evaluated");
  const successfulData = filteredData.find((item) => item.stage === "successful");
  const evaluatedAllData = allData.find((item) => item.stage === "evaluated");
  const successfulAllData = allData.find((item) => item.stage === "successful");

  if (!evaluatedData?.[itemsKey]?.length || !successfulData?.[itemsKey]?.length) return null;
  if (!evaluatedAllData?.[itemsKey]?.length || !successfulAllData?.[itemsKey]?.length) return null;

  const sortedYears = getSortedYears(evaluatedData, itemsKey);

  const labels = {
    caption: getI18nLabel(i18n, `caption-${level}-proportion-participants`),
    level: getI18nLabel(i18n, level),
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
                    {labels.level}
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
                {evaluatedData[itemsKey].map((item) => {
                  const itemName = getItemName(item, level, currentLang);
                  const successfulItem = successfulData[itemsKey].find((s) => s[codeKey] === item[codeKey]);
                  const evaluatedAllItem = evaluatedAllData[itemsKey].find((a) => a[codeKey] === item[codeKey]);
                  const successfulAllItem = successfulAllData[itemsKey].find((a) => a[codeKey] === item[codeKey]);

                  return (
                    <tr key={item[codeKey]}>
                      <th scope="row">{itemName}</th>
                      {/* Projets évalués */}
                      {sortedYears.map((year) => {
                        const yearData = item.years.find((y) => y.year === year);
                        const allYearData = evaluatedAllItem?.years.find((y) => y.year === year);
                        const countryValue = yearData ? yearData[displayType] : 0;
                        const totalValue = allYearData ? allYearData[displayType] : 1;
                        const percentage = totalValue > 0 ? (countryValue / totalValue) * 100 : 0;

                        return <td key={`eval-${year}-${item[codeKey]}`}>{formatToPercentLang(percentage, currentLang)}</td>;
                      })}
                      {/* Projets lauréats */}
                      {sortedYears.map((year) => {
                        const yearData = successfulItem?.years.find((y) => y.year === year);
                        const allYearData = successfulAllItem?.years.find((y) => y.year === year);
                        const countryValue = yearData ? yearData[displayType] : 0;
                        const totalValue = allYearData ? allYearData[displayType] : 1;
                        const percentage = totalValue > 0 ? (countryValue / totalValue) * 100 : 0;

                        return <td key={`succ-${year}-${item[codeKey]}`}>{formatToPercentLang(percentage, currentLang)}</td>;
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
