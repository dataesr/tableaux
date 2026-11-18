import { useSearchParams } from "react-router-dom";
import { getI18nLabel } from "../../../../../../utils";
import { isEjoParam } from "../../../../utils/params";
import { getCountryNameWithArticle } from "../../../../utils/country-mapping";
import { getCountryAdjectives } from "../../../../../../components/country-selector/utils.jsx";
import i18n from "../../../../i18n-global.json";

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

  // Récupérer le paramètre structureid s'il existe
  const structureId = searchParams.get("structureid");
  if (structureId) {
    params.push(`structureid=${structureId}`);
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


  return { params: params.join("&"), currentLang, countryN, adjMascPlural };
}

// Champs génériques (code / name_fr / name_en), avec repli sur les champs du niveau pilier
// (pillar / pilier_name_fr / pilier_name_en) tant que la requête ne renvoie pas les champs génériques
export const getCode = (item): string => String(item?.code ?? item?.pillar ?? "");

export const getName = (item, lang: "fr" | "en" = "fr"): string => {
  const nameFr = item?.name_fr ?? item?.pilier_name_fr ?? "";
  const nameEn = item?.name_en ?? item?.pilier_name_en ?? "";
  return lang === "en" ? nameEn || nameFr : nameFr;
};

export const sortByCode = (items) =>
  [...items].sort((a, b) => getCode(a).localeCompare(getCode(b), undefined, { numeric: true }));

// Ancien nom conservé pour ne pas casser les autres imports éventuels
export const sortByPillar = sortByCode;

/**
 * Génère un composant de tableau accessible avec les données de proportion de financement par pilier
 * @param data - Les données de proportion de financement par pilier
 * @param currentLang - La langue actuelle ('fr' ou 'en')
 * @returns Un composant JSX de tableau accessible ou un message si aucune donnée n'est disponible
 */
export function renderDataTable(data: { data: Array<{ pilier_name_fr: string; stage: string; proportion: number }> }, currentLang: string = "fr") {
  if (!data || !data.data || data.data.length === 0) {
    return <div className="fr-text--center fr-py-3w">{getI18nLabel(i18n, "no-data-table")}</div>;
  }

  interface PillarData {
    pillar: string;
    evaluatedProportion: number;
    successfulProportion: number;
  }

  // Grouper les données par pilier
  const dataByPillar: Record<string, PillarData> = {};

  data.data.forEach((item) => {
    if (!dataByPillar[item.pilier_name_fr]) {
      dataByPillar[item.pilier_name_fr] = {
        pillar: item.pilier_name_fr,
        evaluatedProportion: 0,
        successfulProportion: 0,
      };
    }
    if (item.stage === "evaluated") {
      dataByPillar[item.pilier_name_fr].evaluatedProportion = item.proportion;
    } else if (item.stage === "successful") {
      dataByPillar[item.pilier_name_fr].successfulProportion = item.proportion;
    }
  });

  // sort by pillar code
  const sortedPillars = Object.values(dataByPillar).sort((a, b) => a.pillar.localeCompare(b.pillar, undefined, { numeric: true }));

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat(currentLang === "fr" ? "fr-FR" : "en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(value) + " %";
  };

  const labels = {
    pillar: getI18nLabel(i18n, "pillar"),
    evaluated: getI18nLabel(i18n, "share-evaluated-projects"),
    successful: getI18nLabel(i18n, "share-successful-projects"),
    caption: getI18nLabel(i18n, "caption-pillar-proportion"),
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="fr-table-responsive">
        <table
          className="fr-table fr-table--bordered fr-table--sm"
          style={{ width: "100%" }}
        >
          <caption className="fr-sr-only">{labels.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{labels.pillar}</th>
              <th scope="col">{labels.evaluated}</th>
              <th scope="col">{labels.successful}</th>
            </tr>
          </thead>
          <tbody>
            {sortedPillars.map((pillar, index) => (
              <tr key={index}>
                <th scope="row">{pillar.pillar}</th>
                <td>{formatPercentage(pillar.evaluatedProportion)}</td>
                <td><strong>{formatPercentage(pillar.successfulProportion)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}