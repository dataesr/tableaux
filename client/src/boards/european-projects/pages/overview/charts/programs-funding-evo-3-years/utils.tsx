import { useSearchParams } from "react-router-dom";

import { getI18nLabel } from "../../../../../../utils";
import { formatToMillions, formatToRates, formatNumberLang, formatCurrencyLang } from "../../../../../../utils/format";
import i18n from "../../../../i18n-global.json";
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

  // Récupérer le paramètre programId et l'ajouter comme programs s'il existe
  const programId = searchParams.get("programId");
  if (programId) {
    params.push(`programs=${programId}`);
  }

  const rangeOfYears = searchParams.get("range_of_years");
  if (rangeOfYears) {
    params.push(`range_of_years=${rangeOfYears}`);
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

  return { params: params.filter((item) => !!item).join("&"), currentLang, countryN, adjMascPlural };
}

export function successRatesReadingKey(data, displayType, countryN, adjMascPlural) {
  const dataSelectedCountry = data?.filter((item) => item.country !== "all")[0];
  const year = dataSelectedCountry?.data[0]?.programs[0]?.years[0]?.year || "2021";
  const program_name_fr = dataSelectedCountry?.data[0]?.programs[0]?.programme_name_fr || "unknown";
  const program_name_en = dataSelectedCountry?.data[0]?.programs[0]?.programme_name_en || "unknown";

  // Récupération des données pour le calcul des pourcentages
  const dataGlobal = data?.filter((item) => item.country === "all")[0];

  const dataYearEvaluated = dataSelectedCountry?.data?.find((d) => d.stage === "evaluated")?.programs[0]?.years?.find((y) => y.year === year);
  const dataYearSuccessful = dataSelectedCountry?.data?.find((d) => d.stage === "successful")?.programs[0]?.years?.find((y) => y.year === year);
  const dataYearEvaluatedGlobal = dataGlobal?.data?.find((d) => d.stage === "evaluated")?.programs[0]?.years?.find((y) => y.year === year);
  const dataYearSuccessfulGlobal = dataGlobal?.data?.find((d) => d.stage === "successful")?.programs[0]?.years?.find((y) => y.year === year);

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
          En {year}, dans le programme {program_name_fr}, les projets évalués coordonnés par {countryN} représentent{" "}
          <strong>{formatToRates(pct1Coordination)}</strong> de l'ensemble des projets évalués et les projets lauréats coordonnés par {countryN} représentent{" "}
          <strong>{formatToRates(pct2Coordination)}</strong> de l'ensemble des projets lauréats.
        </>
      );
      en = (
        <>
          In {year}, under the {program_name_en} programme, evaluated projects coordinated by {countryN} account for{" "}
          <strong>{formatToRates(pct1Coordination)}</strong> of all evaluated projects, and successful projects coordinated by {countryN} account for{" "}
          <strong>{formatToRates(pct2Coordination)}</strong> of all successful projects.
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
          En {year}, dans le programme {program_name_fr}, les candidats {adjMascPlural} représentent{" "}
          <strong>{formatToRates(pct1Involved)}</strong> de l'ensemble des candidats et les participants {adjMascPlural} représentent{" "}
          <strong>{formatToRates(pct2Involved)}</strong> de l'ensemble des participants.
        </>
      );
      en = (
        <>
          In {year}, under the {program_name_en} programme, {adjMascPlural} applicants account for{" "}
          <strong>{formatToRates(pct1Involved)}</strong> of all applicants, and {adjMascPlural} participants account for{" "}
          <strong>{formatToRates(pct2Involved)}</strong> of all participants.
        </>
      );
      break;
    }

    case "total_projects": {
      // Participants évalués et lauréats du pays sélectionné
      const evaluatedCountryProject = dataYearEvaluated?.total_projects || 0;
      const successfulCountryProject = dataYearSuccessful?.total_projects || 0;

      // Participants évalués et lauréats globaux
      const evaluatedGlobalProject = dataYearEvaluatedGlobal?.total_projects || 1;
      const successfulGlobalProject = dataYearSuccessfulGlobal?.total_projects || 1;

      // Calcul des pourcentages
      const pct1Proj = evaluatedCountryProject / evaluatedGlobalProject;
      const pct2Proj = successfulCountryProject / successfulGlobalProject;

      fr = (
        <>
          En {year}, dans le programme {program_name_fr},{" "}
          <strong>{formatToRates(pct1Proj)}</strong> des projets évalués et{" "}
          <strong>{formatToRates(pct2Proj)}</strong> des projets lauréats impliquent {countryN}.
        </>
      );
      en = (
        <>
          In {year}, under the {program_name_en} programme,{" "}
          <strong>{formatToRates(pct1Proj)}</strong> of evaluated projects and{" "}
          <strong>{formatToRates(pct2Proj)}</strong> of successful projects involve {countryN}.
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
          En {year}, dans le programme {program_name_fr}, les financements demandés par {countryN} représentent{" "} 
          <strong>{formatToRates(pct1)}</strong> de l'ensemble des financements demandés et les financements obtenus par {countryN} représentent{" "}
          <strong>{formatToRates(pct2)}</strong> de l'ensemble des financements obtenus.
        </>
      );
      en = (
        <>
          In {year}, in the {program_name_en} programme, the funding requested by {countryN} accounts for{" "}
          <strong>{formatToRates(pct1)}</strong> of all funding requested, and the funding secured by {countryN} accounts for{" "}
          <strong>{formatToRates(pct2)}</strong> of all funding secured.
        </>
      );
    }
  }

  return {
    fr: fr,
    en: en,
  };
}

export function valuesSuccessReadingKey(data, displayType, currentLang, countryN, adjMascPlural) {
  const dataSelectedCountry = data?.filter((item) => item.country !== "all")[0];
  const year = dataSelectedCountry?.data[0]?.programs[0]?.years[0]?.year || "2021";
  const dataYearEvaluated = dataSelectedCountry?.data?.find((d) => d.stage === "evaluated")?.programs[0]?.years?.find((y) => y.year === year);
  const dataYearSuccessful = dataSelectedCountry?.data?.find((d) => d.stage === "successful")?.programs[0]?.years?.find((y) => y.year === year);

  const program_name_fr = dataSelectedCountry?.data[0]?.programs[0]?.programme_name_fr || "unknown";
  const program_name_en = dataSelectedCountry?.data[0]?.programs[0]?.programme_name_en || "unknown";

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
  // projects
  const evaluatedTotalProject = dataYearEvaluated?.total_projects || 0;
  const successfulTotalProject = dataYearSuccessful?.total_projects || 0;
  const totalProjectSuccessRate = evaluatedTotalProject > 0 ? successfulTotalProject / evaluatedTotalProject : 0;

  let fr;
  let en;

  switch (displayType) {
    case "total_coordination_number":
      fr = (
        <>
          En {year}, dans le programme {program_name_fr}, {countryN} a coordonné <strong>{formatNumberLang(evaluatedTotalCoordinationNumber, currentLang)}</strong> projets évalués{" "}
          et de <strong>{formatNumberLang(successfulTotalCoordinationNumber, currentLang)}</strong> projets lauréats,{" "}
          soit un taux de succès de <strong>{formatToRates(totalCoordinationNumberSuccessRate)}</strong>.
        </>
      );
      en = (
        <>
          In {year}, under the {program_name_en} programme, {countryN} coordinated <strong>{formatNumberLang(evaluatedTotalCoordinationNumber, currentLang)}</strong> evaluated projects{" "}
          and <strong>{formatNumberLang(successfulTotalCoordinationNumber, currentLang)}</strong> successful projects,{" "}
          a success rate of <strong>{formatToRates(totalCoordinationNumberSuccessRate)}</strong>.
        </>
      );
      break;

    case "total_number_involved":
      fr = (
        <>
          En {year}, dans le programme {program_name_fr}, sur les <strong>{formatNumberLang(evaluatedTotalNumberInvolved, currentLang)}</strong> candidats {adjMascPlural} évalués{" "}
          <strong>{formatNumberLang(successfulTotalNumberInvolved, currentLang)}</strong> ont été lauréats,{" "}
          soit un taux de succès de <strong>{formatToRates(totalNumberInvolvedSuccessRate)}</strong>.
        </>
      );
      en = (
        <>
          In {year}, under the {program_name_en} programme, of the <strong>{formatNumberLang(evaluatedTotalNumberInvolved, currentLang)}</strong> {adjMascPlural} applicants evaluated,{" "}
          <strong>{formatNumberLang(successfulTotalNumberInvolved, currentLang)}</strong> became participants in successful projects,{" "}
          a participant-level success rate of <strong>{formatToRates(totalNumberInvolvedSuccessRate)}</strong>.
        </>
      );
      break;

    case "total_projects":
      fr = (
        <>
          En {year}, dans le programme {program_name_fr}, {countryN} est présente dans <strong>{formatNumberLang(evaluatedTotalProject, currentLang)}</strong> projets évalués{" "}
          et <strong>{formatNumberLang(successfulTotalProject, currentLang)}</strong> projets lauréats, soit un taux de succès de <strong>{formatToRates(totalProjectSuccessRate)}</strong>.
        </>
      );
      en = (
        <>
          In {year}, under the {program_name_en} programme, {countryN} is involved in <strong>{formatNumberLang(evaluatedTotalProject, currentLang)}</strong> evaluated projects{" "}
          and <strong>{formatNumberLang(successfulTotalProject, currentLang)}</strong> successful projects, a success rate of <strong>{formatToRates(totalProjectSuccessRate)}</strong>.
        </>
      );
      break;

    default:
      fr = (
        <>
          En {year}, dans le programme {program_name_fr}, {countryN} a demandé <strong>{formatCurrencyLang(evaluatedFunding, currentLang)}</strong> dans les projets évalués{" "}
          et a obtenu <strong>{formatCurrencyLang(successfulFunding, currentLang)}</strong>, soit un taux de succès de{" "}
          <strong>{formatToRates(successRate)}</strong>.
        </>
      );
      en = (
        <>
          In {year}, under the {program_name_en} programme, {countryN} requested <strong>{formatCurrencyLang(evaluatedFunding, currentLang)}</strong> in evaluated projects{" "}
          and secured <strong>{formatCurrencyLang(successfulFunding, currentLang)}</strong>, a funding success rate of{" "}
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
  if (!data) return null;

  const filteredData = data.filter((item) => item.country !== "all")[0].data;
  const evaluatedData = filteredData.find((item) => item.stage === "evaluated");
  const successfulData = filteredData.find((item) => item.stage === "successful");

  const years = new Set();
  evaluatedData.programs[0].years.forEach((year) => years.add(year.year));
  const sortedYears = Array.from(years).sort();

  const labels = {
    caption: getI18nLabel(i18n, "caption-program-evolution"),
    program: getI18nLabel(i18n, "program"),
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
                    {labels.program}
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
                {evaluatedData.programs.map((program) => {
                  const programName = currentLang === "fr" ? program.programme_name_fr : program.programme_name_en;
                  const successfulProgram = successfulData.programs.find((p) => p.programme_code === program.programme_code);

                  return (
                    <tr key={program.programme_code}>
                      <th scope="row">{programName}</th>
                      {sortedYears.map((year) => {
                        const evaluatedYearData = program.years.find((y) => y.year === year);
                        const successfulYearData = successfulProgram?.years.find((y) => y.year === year);

                        const evaluatedValue = evaluatedYearData ? evaluatedYearData[displayType] : 0;
                        const successfulValue = successfulYearData ? successfulYearData[displayType] : 0;
                        const successRate = evaluatedValue > 0 ? ((successfulValue / evaluatedValue) * 100).toFixed(1) : "0.0";

                        return (
                          <>
                            <td key={`eval-${year}-${program.programme_code}`}>{formatValue(evaluatedValue)}</td>
                            <td key={`succ-${year}-${program.programme_code}`}>{formatValue(successfulValue)}</td>
                            <td key={`rate-${year}-${program.programme_code}`}>{successRate} %</td>
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
  if (!data) return null;

  const filteredData = data.filter((item) => item.country !== "all")[0].data;
  const allData = data.find((item) => item.country === "all").data;
  const evaluatedData = filteredData.find((item) => item.stage === "evaluated");
  const successfulData = filteredData.find((item) => item.stage === "successful");
  const evaluatedAllData = allData.find((item) => item.stage === "evaluated");
  const successfulAllData = allData.find((item) => item.stage === "successful");

  const years = new Set();
  evaluatedData.programs[0].years.forEach((year) => years.add(year.year));
  const sortedYears = Array.from(years).sort();

  const labels = {
    caption: getI18nLabel(i18n, "caption-program-proportion-participants"),
    program: getI18nLabel(i18n, "program"),
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
                    {labels.program}
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
                {evaluatedData.programs.map((program) => {
                  const programName = currentLang === "fr" ? program.programme_name_fr : program.programme_name_en;
                  const successfulProgram = successfulData.programs.find((p) => p.programme_code === program.programme_code);
                  const evaluatedAllProgram = evaluatedAllData.programs.find((p) => p.programme_code === program.programme_code);
                  const successfulAllProgram = successfulAllData.programs.find((p) => p.programme_code === program.programme_code);

                  return (
                    <tr key={program.programme_code}>
                      <th scope="row">{programName}</th>
                      {/* Projets évalués */}
                      {sortedYears.map((year, index) => {
                        const yearData = program.years.find((y) => y.year === year);
                        const allYearData = evaluatedAllProgram?.years[index];
                        const countryValue = yearData ? yearData[displayType] : 0;
                        const totalValue = allYearData ? allYearData[displayType] : 1;
                        const percentage = totalValue > 0 ? ((countryValue / totalValue) * 100).toFixed(1) : "0.0";

                        return <td key={`eval-${year}-${program.programme_code}`}>{percentage} %</td>;
                      })}
                      {/* Projets lauréats */}
                      {sortedYears.map((year, index) => {
                        const yearData = successfulProgram?.years.find((y) => y.year === year);
                        const allYearData = successfulAllProgram?.years[index];
                        const countryValue = yearData ? yearData[displayType] : 0;
                        const totalValue = allYearData ? allYearData[displayType] : 1;
                        const percentage = totalValue > 0 ? ((countryValue / totalValue) * 100).toFixed(1) : "0.0";

                        return <td key={`succ-${year}-${program.programme_code}`}>{percentage} %</td>;
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
