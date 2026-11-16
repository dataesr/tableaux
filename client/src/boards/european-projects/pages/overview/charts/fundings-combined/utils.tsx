import { useSearchParams } from "react-router-dom";
import { getI18nLabel } from "../../../../../../utils";
import { isEjoParam } from "../../../../utils/params";
import { formatToMillionsLang, formatToPercentLang } from "../../../../../../utils/format";
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

  return { params: params.join("&"), currentLang, countryN, adjMascPlural };
}

/**
 * Génère un composant de tableau accessible avec les données de financement par pilier
 * @param data - Les données de financement par pilier
 * @param currentLang - La langue actuelle ('fr' ou 'en')
 * @returns Un composant JSX de tableau accessible ou un message si aucune donnée n'est disponible
 */
export function renderDataTable(data: { data: Array<{ pilier_name_fr: string; stage: string; total_fund_eur: number }> }, currentLang: "fr" | "en" = "fr") {
  
  if (!data || !data.data || data.data.length === 0) {
    return <div className="fr-text--center fr-py-3w">{getI18nLabel(i18n, "no-data-table")}</div>;
  }

  interface PillarData {
    pillar: string;
    evaluated: number;
    successful: number;
    successRate: number;
  }

  // Grouper les données par pilier
  const dataByPillar: Record<string, PillarData> = {};

  data.data.forEach((item) => {
    if (!dataByPillar[item.pilier_name_fr]) {
      dataByPillar[item.pilier_name_fr] = {
        pillar: item.pilier_name_fr,
        evaluated: 0,
        successful: 0,
        successRate: 0,
      };
    }
    if (item.stage === "evaluated") {
      dataByPillar[item.pilier_name_fr].evaluated = item.total_fund_eur;
    } else if (item.stage === "successful") {
      dataByPillar[item.pilier_name_fr].successful = item.total_fund_eur;
    }
  });

  // Calculer le taux de succès
  Object.values(dataByPillar).forEach((pillar) => {
    if (pillar.evaluated > 0) {
      pillar.successRate = (pillar.successful / pillar.evaluated) * 100;
    }
  });

  // Trier par financement successful (décroissant)
  const sortedPillars = Object.values(dataByPillar).sort((a, b) => b.successful - a.successful);

  const labels = {
    pillar: getI18nLabel(i18n, "pillar"),
    evaluated: getI18nLabel(i18n, "projects-evaluated"),
    successful: getI18nLabel(i18n, "projects-successful"),
    successRate: getI18nLabel(i18n, "success-rate"),
    caption: getI18nLabel(i18n, "caption-pillar-funding"),
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="fr-table-responsive">
        <table className="fr-table fr-table--bordered fr-table--sm" style={{ width: "100%" }}>
          <caption className="fr-sr-only">{labels.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{labels.pillar}</th>
              <th scope="col">{labels.evaluated}</th>
              <th scope="col">{labels.successful}</th>
              <th scope="col">{labels.successRate}</th>
            </tr>
          </thead>
          <tbody>
            {sortedPillars.map((pillar, index) => (
              <tr key={index}>
                <th scope="row">{pillar.pillar}</th>
                <td>
                  {formatToMillionsLang(pillar.evaluated, currentLang, 1)}
                </td>
                <td>
                  <strong>
                    {formatToMillionsLang(pillar.successful, currentLang, 1)}
                  </strong>
                </td>
                <td>{pillar.successRate > 0 ? formatToPercentLang(pillar.successRate, currentLang) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
