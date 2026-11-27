import { useSearchParams } from "react-router-dom";

import { getCountryAdjectives } from "../../../../../../components/country-selector/utils.jsx";
import { getI18nLabel } from "../../../../../../utils";
import { formatToPercentLang } from "../../../../../../utils/format";
import i18n from "../../../../i18n-global.json";
import { getCountryNameWithArticle } from "../../../../utils/country-mapping";
import { isEjoParam } from "../../../../utils/params";

type Lang = "fr" | "en";

export type ProportionItem = {
  code: string;
  name_fr?: string;
  name_en?: string;
  stage: string;
  proportion: number;
  proportion_coordination_number: number;
  proportion_number_involved: number;
  proportion_count: number;
  proportion_projects: number;
};

export type ProportionData = { data: ProportionItem[] };

export function useGetParams() {
  const [searchParams] = useSearchParams();

  const params: string[] = [];

  const countryCode = searchParams.get("country_code");
  if (countryCode) params.push(`country_code=${countryCode}`);

  const pillarId = searchParams.get("pillarId");
  if (pillarId) params.push(`pillars=${pillarId}`);

  const programId = searchParams.get("programId");
  if (programId) params.push(`programs=${programId}`);

  const rangeOfYears = searchParams.get("range_of_years");
  if (rangeOfYears) params.push(`range_of_years=${encodeURIComponent(rangeOfYears)}`);

  if (searchParams.has("isEjo")) params.push(isEjoParam());

  const currentLang = (searchParams.get("language") === "en" ? "en" : "fr") as Lang;

  const code = countryCode || "FRA";
  const countryN = getCountryNameWithArticle(code, currentLang).replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase());

  const countryAdj = getCountryAdjectives(code, currentLang);
  // Pluriel seulement en français
  const adjMascPlural = currentLang === "fr" && !countryAdj.m.endsWith("s") ? `${countryAdj.m}s` : countryAdj.m;

  return { params: params.join("&"), currentLang, countryN, adjMascPlural };
}

// Nom dans la langue demandée (repli sur le FR puis sur le code)
export const getName = (item: ProportionItem | undefined, lang: Lang) =>
  (lang === "en" ? item?.name_en : item?.name_fr) || item?.name_fr || item?.code || "";

// Clé de proportion renvoyée par l'API selon l'indicateur affiché
export const getProportionKey = (displayType: string) =>
  displayType === "total_coordination_number"
    ? "proportion_coordination_number"
    : displayType === "total_number_involved"
      ? "proportion_number_involved"
      : displayType === "total_projects"
        ? "proportion_projects"
        : "proportion";

// Codes dans l'ordre renvoyé par l'API (ne pas re-trier côté front)
export const getOrderedCodes = (items: ProportionItem[]) => Array.from(new Set(items.map((item) => item.code)));

export const findItem = (items: ProportionItem[], code: string, stage: string) =>
  items.find((item) => item.code === code && item.stage === stage);

export function renderDataTable(data: ProportionData | null | undefined, currentLang: Lang) {
  const items = data?.data;
  if (!items || items.length === 0) {
    return <div className="fr-text--center fr-py-3w">{getI18nLabel(i18n, "no-data-table")}</div>;
  }

  const labels = {
    level: getI18nLabel(i18n, "topic") || "Thématique",
    evaluated: getI18nLabel(i18n, "share-evaluated-projects"),
    successful: getI18nLabel(i18n, "share-successful-projects"),
    caption: getI18nLabel(i18n, "funding-proportion-by-country"),
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="fr-table-responsive">
        <table className="fr-table fr-table--bordered fr-table--sm" style={{ width: "100%" }}>
          <caption className="fr-sr-only">{labels.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{labels.level}</th>
              <th scope="col">{labels.evaluated}</th>
              <th scope="col">{labels.successful}</th>
            </tr>
          </thead>
          <tbody>
            {getOrderedCodes(items).map((code) => {
              const evaluated = findItem(items, code, "evaluated");
              const successful = findItem(items, code, "successful");
              return (
                <tr key={code}>
                  <th scope="row">{getName(evaluated ?? successful, currentLang)}</th>
                  <td>{formatToPercentLang(evaluated?.proportion ?? 0, currentLang)}</td>
                  <td>
                    <strong>{formatToPercentLang(successful?.proportion ?? 0, currentLang)}</strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Clé de proportion renvoyée par l'API selon l'indicateur affiché
export const getProportionKey = (displayType: string) =>
  displayType === "total_coordination_number"
    ? "proportion_coordination_number"
    : displayType === "total_number_involved"
      ? "proportion_number_involved"
      : displayType === "total_fund_eur"
        ? "proportion"
        : "proportion_projects"


export function readingKey(data, isLoading, displayType, currentLang, countryN, adjMascPlural) {
  if (isLoading || !data?.data || data.data.length === 0) {
    return { fr: <></>, en: <></> }
  }

  const proportionKey = getProportionKey(displayType)

  const successfulProjects = data.data.filter((item) => item.stage === "successful")
  const topSuccessfulTheme = successfulProjects.reduce(
    (max, current) => (current[proportionKey] > max[proportionKey] ? current : max),
    successfulProjects[0],
  )

  if (!topSuccessfulTheme) return { fr: <></>, en: <></> }

  const evaluatedData = data.data.find((item) => item.topic === topSuccessfulTheme.topic && item.stage === "evaluated")
  if (!evaluatedData) return { fr: <></>, en: <></> }
  
  const themaNameFr = topSuccessfulTheme.thema_name_fr
  const themaNameEn = topSuccessfulTheme.thema_name_en
  const successfulProportion = topSuccessfulTheme[proportionKey]
  const evaluatedProportion = evaluatedData[proportionKey]
  const difference = successfulProportion - evaluatedProportion

  const diff = `${difference > 0 ? "+" : ""}${formatNumberLang(difference, currentLang, 2)}`

  let fr
  let en

  switch (displayType) {
    case "total_coordination_number":
      fr = (
        <>
          Dans la thématique {themaNameFr}, les projets évalués coordonnés par {countryN} représentent {formatToPercentLang(evaluatedProportion, currentLang)}{" "}
          de l'ensemble des projets évalués et les projets lauréats coordonnés par {countryN} représentent{" "}
          {formatToPercentLang(successfulProportion, currentLang)} des projets lauréats, soit un écart de{" "}
          {diff} points.
        </>
      )
      en = (
        <>
          In the {themaNameEn} theme, evaluated projects coordinated by {countryN} account for {formatToPercentLang(evaluatedProportion, currentLang)}{" "}
          of all evaluated projects, and successful projects coordinated by {countryN} account for{" "}
          {formatToPercentLang(successfulProportion, currentLang)} of successful projects, a difference of{" "}
          {diff} percentage points.
        </>
      )
      break
    case "total_number_involved":
      fr = (
        <>
          Dans la thématique {themaNameFr}, les candidats {adjMascPlural} représentent {formatToPercentLang(evaluatedProportion, currentLang)}{" "}
          de l'ensemble des candidats et les participants {adjMascPlural} représentent {formatToPercentLang(successfulProportion, currentLang)} de{" "}
          l'ensemble des participants, soit un écart de {diff} points.
        </>
      )
      en = (
        <>
          In the {themaNameEn} theme, {adjMascPlural} applicants account for {formatToPercentLang(evaluatedProportion, currentLang)}{" "}
          of all applicants, and {adjMascPlural} participants account for {formatToPercentLang(successfulProportion, currentLang)} of{" "}
          all participants, a difference of {diff} percentage points.
        </>
      )
      break
    case "total_projects":
      fr = (
        <>
          Dans la thématique {themaNameFr}, {formatToPercentLang(evaluatedProportion, currentLang)} des projets évalués et{" "} 
          {formatToPercentLang(successfulProportion, currentLang)} des projets lauréats impliquent {countryN}, soit un écart de {diff} points.
        </>
      )
      en = (
        <>
          In the {themaNameEn} theme, {formatToPercentLang(evaluatedProportion, currentLang)} of evaluated projects and{" "}
          {formatToPercentLang(successfulProportion, currentLang)} of successful projects involve {countryN}, a difference of {diff} percentage points.
        </>
      )
      break
    default:
      fr = (
        <>
          Dans la thématique {themaNameFr}, les financements demandés par {countryN} représentent {formatToPercentLang(evaluatedProportion, currentLang)}{" "}
          de l'ensemble des financements demandés et les financements obtenus par {countryN} représentent {formatToPercentLang(successfulProportion, currentLang)}{" "}
          des financements obtenus, soit un écart de {diff} points.
        </>
      )
      en = (
        <>
          In the {themaNameEn} theme, funding requested by {countryN} accounts for {formatToPercentLang(evaluatedProportion, currentLang)}{" "}
          of all funding requested, and funding secured by {countryN} accounts for {formatToPercentLang(successfulProportion, currentLang)}{" "}
          of funding secured, a difference of {diff} percentage points.
        </>
      )
  }
    return { fr, en }
}
