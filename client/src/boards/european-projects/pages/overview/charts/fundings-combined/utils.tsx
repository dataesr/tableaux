import { useSearchParams } from "react-router-dom";

import { getCountryAdjectives } from "../../../../../../components/country-selector/utils.jsx";
import { getI18nLabel } from "../../../../../../utils";
import { formatToMillionsLang, formatToPercentLang } from "../../../../../../utils/format";
import i18n from "../../../../i18n-global.json";
import { getCountryNameWithArticle } from "../../../../utils/country-mapping";
import { type Level, sortByLevel } from "../../../../utils/levelsSort";
import { isEjoParam } from "../../../../utils/params";

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

  // Récupérer le paramètre thematicIds et l'ajouter comme topics s'il existe
  const thematicIds = searchParams.get("thematicIds");
  if (thematicIds) {
    params.push(`thematics=${thematicIds}`);
  }

  // Récupérer le paramètre structureid s'il existe
  const structureId = searchParams.get("structureid");
  if (structureId) {
    params.push(`structureid=${structureId}`);
  }

  const rangeOfYears = searchParams.get("range_of_years");
  if (rangeOfYears) {
    params.push(`range_of_years=${encodeURIComponent(rangeOfYears)}`);
  }

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }

  const currentLang = (searchParams.get("language") === "en" ? "en" : "fr") as "fr" | "en";

  const code = countryCode || "FRA";
  const countryN = getCountryNameWithArticle(code, currentLang).replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase());

  const countryAdj = getCountryAdjectives(code, currentLang);
  // Pluriel seulement en français
  const adjMascPlural = currentLang === "fr" && !countryAdj.m.endsWith("s") ? `${countryAdj.m}s` : countryAdj.m;

  return { adjMascPlural, countryN, currentLang, params: params.join("&") };
}

/**
 * Génère un composant de tableau accessible avec les données de financement par niveau
 * @param data - Les données de financement du niveau (pilier, programme, topic ou destination)
 * @param currentLang - La langue actuelle ('fr' ou 'en')
 * @param groupBy - Le niveau de la nomenclature
 * @returns Un composant JSX de tableau accessible ou un message si aucune donnée n'est disponible
 */
export function renderDataTable(data: { data: Array<{ code?: string; name_fr?: string; name_en?: string; pilier_name_fr?: string; stage: string; total_fund_eur: number }> }, currentLang: "fr" | "en" = "fr", groupBy: Level = "pillar") {
  
  if (!data || !data.data || data.data.length === 0) {
    return <div className="fr-text--center fr-py-3w">{getI18nLabel(i18n, "no-data-table")}</div>;
  }

  interface LevelData {
    name: string;
    evaluated: number;
    successful: number;
    successRate: number;
  }

  const getKey = (item: (typeof data.data)[number]) => item.code ?? item.name_fr ?? item.pilier_name_fr ?? "";
  const getName = (item: (typeof data.data)[number]) => (currentLang === "en" ? item.name_en : item.name_fr) ?? item.name_fr ?? item.pilier_name_fr ?? item.code ?? "";

  // Grouper les données par niveau (déjà triées selon le niveau)
  const dataByLevel: Record<string, LevelData> = {};

  sortByLevel(data.data, groupBy).forEach((item) => {
    if (!dataByLevel[getKey(item)]) {
      dataByLevel[getKey(item)] = {
        name: getName(item),
        evaluated: 0,
        successful: 0,
        successRate: 0,
      };
    }
    if (item.stage === "evaluated") {
      dataByLevel[getKey(item)].evaluated = item.total_fund_eur;
    } else if (item.stage === "successful") {
      dataByLevel[getKey(item)].successful = item.total_fund_eur;
    }
  });

  // Calculer le taux de succès
  Object.values(dataByLevel).forEach((level) => {
    if (level.evaluated > 0) {
      level.successRate = (level.successful / level.evaluated) * 100;
    }
  });

  // Ordre de la nomenclature (conservé depuis sortByLevel)
  const sortedLevels = Object.values(dataByLevel);

  const labels = {
    level: getI18nLabel(i18n, groupBy),
    evaluated: getI18nLabel(i18n, "projects-evaluated"),
    successful: getI18nLabel(i18n, "projects-successful"),
    successRate: getI18nLabel(i18n, "success-rate"),
    caption: getI18nLabel(i18n, `caption-${groupBy}-funding`),
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
              <th scope="col">{labels.successRate}</th>
            </tr>
          </thead>
          <tbody>
            {sortedLevels.map((level, index) => (
              <tr key={index}>
                <th scope="row">{level.name}</th>
                <td>
                  {formatToMillionsLang(level.evaluated, currentLang, 1)}
                </td>
                <td>
                  <strong>
                    {formatToMillionsLang(level.successful, currentLang, 1)}
                  </strong>
                </td>
                <td>{level.successRate > 0 ? formatToPercentLang(level.successRate, currentLang) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}