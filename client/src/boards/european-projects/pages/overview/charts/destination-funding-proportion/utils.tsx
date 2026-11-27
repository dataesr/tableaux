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

  const thematicIds = searchParams.get("thematicIds");
  if (thematicIds) params.push(`thematics=${thematicIds}`);

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
    level: getI18nLabel(i18n, "destination") || "Destination",
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
