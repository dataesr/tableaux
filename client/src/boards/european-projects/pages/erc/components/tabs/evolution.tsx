import { useSearchParams } from "react-router-dom";
import { getCountryAdjectives } from "../../../../../../components/country-selector/utils";
import EvolutionFundingsCharts from "../../charts/evolution-fundings";
import EvolutionPanelsCharts from "../../charts/evolution-panels";
import EvolutionPanelDetail from "../../charts/evolution-panel-detail";

export default function EvolutionContent() {
  const [searchParams] = useSearchParams();

  // Récupérer les paramètres de filtres depuis l'URL
  const countryCode = searchParams.get("country_code") || "FRA";
  const currentLang = searchParams.get("language") || "fr";

  // Adjectifs de nationalité (masculin et féminin)
  const countryAdj = getCountryAdjectives(countryCode);

  return (
    <div>
      {/* Graphiques d'évolution par type de financement */}
      <div className="fr-my-4w">
        <EvolutionFundingsCharts countryAdjective={countryAdj.f} currentLang={currentLang} />
      </div>

      {/* Graphiques d'évolution par domaine scientifique */}
      <div className="fr-my-4w">
        <EvolutionPanelsCharts countryAdjective={countryAdj.f} currentLang={currentLang} />
      </div>

      {/* Sélection du domaine et évolution par panel */}
      <div className="fr-my-4w">
        <EvolutionPanelDetail countryCode={countryCode} currentLang={currentLang} />
      </div>
    </div>
  );
}
