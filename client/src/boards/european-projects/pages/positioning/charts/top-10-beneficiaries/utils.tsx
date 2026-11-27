import { useSearchParams } from "react-router-dom";

import { getI18nLabel } from "../../../../../../utils";
import { formatCurrencyLang, formatToMillionsLang, formatToPercentLang } from "../../../../../../utils/format";
import i18n from "../../../../i18n-global.json";
import { getCountryNameWithArticle } from "../../../../utils/country-mapping";
import { isEjoParam } from "../../../../utils/params";
import {
  fillPlaceholders as fillTemplate,
  getLevelVars,
  LEVELS,
  type Lang,
  type Level,
  type LevelName,
} from "../../../../utils/levelsGet";
import i18nTop10 from "./i18n.json";

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

  // Récupérer le paramètre range_of_years
  const rangeOfYears = searchParams.get("range_of_years");
  if (rangeOfYears) {
    params.push(`range_of_years=${rangeOfYears}`);
  }

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }

  const currentLang = (searchParams.get("language") === "en" ? "en" : "fr") as Lang;

  // Ajouter le paramètre stage par défaut
  params.push("stage=successful");

  return { currentLang, params: params.filter((item) => !!item).join("&") };
}


// --- Niveau sélectionné (propre au positioning : top-10 et intro) ---

// Libellé exploitable (non vide, différent de "unknown")
const isValidName = (v) => typeof v === "string" && v.trim() !== "" && v.trim().toLowerCase() !== "unknown";

// Niveau sélectionné renvoyé par l'API (champ "level" de la route top-10-beneficiaries) :
// { type: "pillar" | "program" | "topic" | "destination", items: [{ code, name_fr, name_en }] } ou null
export function getLevelFromResponse(data): { level: Level | null; name: LevelName | null; count: number } {
  const type = data?.level?.type;
  if (!type || !LEVELS[type]) return { level: null, name: null, count: 1 };

  const items = data.level.items ?? [];
  const first = items[0];
  const name = first
    ? {
        fr: [first.name_fr, first.name_en].find(isValidName) ?? first.code,
        en: [first.name_en, first.name_fr].find(isValidName) ?? first.code,
      }
    : null;

  return { level: type, name, count: Math.max(items.length, 1) };
}

const NO_LEVEL: Record<Lang, string> = { fr: "par Horizon Europe", en: "under Horizon Europe" };
const IN: Record<Lang, string> = { fr: "dans", en: "in" };

// Fragment à insérer en milieu de phrase :
// - aucun niveau ("tous les piliers") : "par Horizon Europe"
// - 1 élément                         : "dans le pilier Excellence science"
// - plusieurs éléments                : "dans les thématiques sélectionnées"
export function getLevelText({
  level,
  lang,
  name,
  count = 1,
}: {
  level: Level | null;
  lang: Lang;
  name: LevelName | null;
  count?: number;
}): string {
  if (!level) return NO_LEVEL[lang];
  const vars = getLevelVars(level, name?.[lang] ?? "", lang, count);
  if (count > 1) return `${IN[lang]} ${vars.selected}`;
  return vars.inLevel;
}

// Commentaire du graph, avec le niveau sélectionné
// levelText : { fr: "dans le pilier Excellence science", en: "in the pillar Excellent science" }
const ALL_LEVELS: Record<Lang, string> = { fr: "pour l'ensemble d'Horizon Europe", en: "for Horizon Europe as a whole" };
const FOR: Record<Lang, string> = { fr: "pour", en: "for" };

// {selectedText} :
// - aucun niveau : "pour l'ensemble d'Horizon Europe"
// - sinon        : "pour le pilier sélectionné" / "pour les thématiques sélectionnées"
function getSelectedText(level: Level | null, lang: Lang, count = 1): string {
  if (!level) return ALL_LEVELS[lang];
  return `${FOR[lang]} ${getLevelVars(level, "", lang, count).selected}`;
}

// Commentaire du graph : reçoit data, comme readingKey
export function comment(data) {
  const { level, count } = getLevelFromResponse(data);
  return {
    fr: <>{fillTemplate(i18nTop10.comment.fr, { selectedText: getSelectedText(level, "fr", count) })}</>,
    en: <>{fillTemplate(i18nTop10.comment.en, { selectedText: getSelectedText(level, "en", count) })}</>,
  };
}

export function readingKey(data, currentLang: Lang) {
  if (!data?.top10 || data.top10.length === 0) {
    return {
      fr: <></>,
      en: <></>,
    };
  }

  // "dans le pilier Excellence scientifique" / "par Horizon Europe"
  const { level, name, count: levelCount } = getLevelFromResponse(data);
  const levelText = {
    fr: getLevelText({ level, lang: "fr", name, count: levelCount }),
    en: getLevelText({ level, lang: "en", name, count: levelCount }),
  };

  const topCountry = data.top10[0];
  const secondCountry = data.top10.length > 1 ? data.top10[1] : null;
  const tenthCountry = data.top10.length >= 10 ? data.top10[9] : data.top10[data.top10.length - 1];
  const count = String(Math.min(data.top10.length, 10));

  const build = (lang: Lang) => {
    const tpl = i18nTop10.readingKey;
    // Article en minuscule en milieu de phrase ("suivi par la France")
    const secondName = secondCountry
      ? getCountryNameWithArticle(secondCountry.id, lang).replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase())
      : "";

    return (
      <>
        {fillTemplate(tpl.first[lang], {
          country: getCountryNameWithArticle(topCountry.id, lang),
          amount: formatCurrencyLang(topCountry.total_fund_eur, currentLang),
          levelText: levelText[lang],
        })}
        {secondCountry &&
          fillTemplate(tpl.second[lang], {
            country: secondName,
            amount: formatCurrencyLang(secondCountry.total_fund_eur, currentLang),
          })}
        {fillTemplate(tpl.total[lang], {
          count,
          percent: formatToPercentLang(tenthCountry.influence, currentLang),
        })}
      </>
    );
  };

  return { fr: build("fr"), en: build("en") };
}

export function renderDataTable(data, currentLang, selectedCountryCode) {
  if (!data || data.length === 0) return null;

  const labels = {
    caption: getI18nLabel(i18n, "caption-top-10-beneficiaries"),
    rank: getI18nLabel(i18n, "rank"),
    country: getI18nLabel(i18n, "country"),
    funding: getI18nLabel(i18n, "total-subsidies"),
    influence: getI18nLabel(i18n, "cumulative-weight-percent"),
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
                  <th scope="col">{labels.rank}</th>
                  <th scope="col">{labels.country}</th>
                  <th scope="col">{labels.funding}</th>
                  <th scope="col">{labels.influence}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const countryName = currentLang === "fr" ? item.name_fr : item.name_en;
                  const isSelectedCountry = item.id === selectedCountryCode;

                  return (
                    <tr key={item.id} style={isSelectedCountry ? { fontWeight: "bold" } : undefined}>
                      <th scope="row">{index + 1}</th>
                      <td>{countryName}</td>
                      <td>{formatToMillionsLang(item.total_fund_eur, currentLang)}</td>
                      <td>{formatToPercentLang(item.influence, currentLang)}</td>
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