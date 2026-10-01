import { useSearchParams } from "react-router-dom";
import { formatToMillions } from "../../../../../../utils/format";
import { isEjoParam } from "../../../../utils/params";
import type { PanelFundingItem } from "./query";

export function useGetParams(stage: string = "successful") {
  const [searchParams] = useSearchParams();

  const params: string[] = [];

  // Récupérer le paramètre country_code s'il existe
  const countryCode = searchParams.get("country_code");
  if (countryCode) {
    params.push(`country_code=${countryCode}`);
  }

  // Récupérer le paramètre range_of_years
  const rangeOfYears = searchParams.get("range_of_years");
  if (rangeOfYears) {
    // Convertir range_of_years en call_year pour l'API
    const [startYear, endYear] = rangeOfYears.split("-").map(Number);
    const years: string[] = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year.toString());
    }
    params.push(`call_year=${years.join(",")}`);
  }

  // Ajouter le paramètre stage
  params.push(`stage=${stage}`);

  const currentLang = searchParams.get("language") || "fr";

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }

  return { params: params.join("&"), currentLang };
}

export interface AverageLines {
  avgX: number;
  avgY: number;
}

// Domaines valides pour les panels ERC
const VALID_DOMAINS = ["LS", "PE", "SH"];

/**
 * Calcule les moyennes pour les lignes de référence
 * Ne prend en compte que les données avec un domaine scientifique valide
 */
export function calculateAverages(data: PanelFundingItem[]): AverageLines {
  if (!data || data.length === 0) {
    return { avgX: 0, avgY: 0 };
  }

  // Filtrer les données avec domaine valide
  const filteredData = data.filter((item) => VALID_DOMAINS.includes(item.domaine_scientifique));

  if (filteredData.length === 0) {
    return { avgX: 0, avgY: 0 };
  }

  const totalX = filteredData.reduce((sum, item) => sum + item.total_pi, 0);
  const totalY = filteredData.reduce((sum, item) => sum + item.total_funding_entity, 0);

  return {
    avgX: totalX / filteredData.length,
    avgY: totalY / filteredData.length,
  };
}

/**
 * Render le tableau de données pour l'export
 */
export function renderDataTable(data: PanelFundingItem[], currentLang: string) {
  if (!data || data.length === 0) return null;

  const labels = {
    caption: currentLang === "fr" ? "Financements par panel ERC" : "ERC Panel Funding",
    panel: currentLang === "fr" ? "Panel" : "Panel",
    domain: currentLang === "fr" ? "Domaine scientifique" : "Scientific domain",
    destination: currentLang === "fr" ? "Type de financement" : "Funding type",
    funding: currentLang === "fr" ? "Financement (M€)" : "Funding (M€)",
    pi: currentLang === "fr" ? "Nombre de PI" : "Number of PIs",
  };

  return (
    <table className="fr-table">
      <caption>{labels.caption}</caption>
      <thead>
        <tr>
          <th scope="col">{labels.panel}</th>
          <th scope="col">{labels.domain}</th>
          <th scope="col">{labels.destination}</th>
          <th scope="col">{labels.funding}</th>
          <th scope="col">{labels.pi}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={`${item.panel_id}-${item.destination_code}-${index}`}>
            <td>{item.panel_lib || item.panel_id}</td>
            <td>{item.domaine_name_scientifique || item.domaine_scientifique}</td>
            <td>{item.destination_code}</td>
            <td>{formatToMillions(item.total_funding_entity)}</td>
            <td>{item.total_pi}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
