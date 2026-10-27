import { useSearchParams } from "react-router-dom";
import { getI18nLabel } from "../../../../../../utils";
import { getCountryAdjectives } from "../../../../../../components/country-selector/utils";
import { MscaSynthesisCards, MscaDestinationCards, MscaPanelCards } from "../../../../components/cards/msca";
import DestinationChart from "../../charts/destination-chart";
import PanelChart from "../../charts/panel-chart";
import { rangeOfYearsToApiFormat } from "../../url-utils";
import i18n from "../../i18n.json";

export default function SyntheseContent() {
  const [searchParams] = useSearchParams();

  const countryCode = searchParams.get("country_code") || "FRA";
  const rangeOfYears = searchParams.get("range_of_years");
  const callYear = rangeOfYearsToApiFormat(rangeOfYears);
  const currentLang = searchParams.get("language") || "fr";

  const countryAdj = getCountryAdjectives(countryCode);

  return (
    <div>
      <h2 className="fr-mb-3w">{getI18nLabel(i18n, "page.title", currentLang)}</h2>
      <MscaSynthesisCards countryCode={countryCode} callYear={callYear} countryAdj={countryAdj} />

      {/* Cartes par type de financement MSCA */}
      <MscaDestinationCards countryCode={countryCode} callYear={callYear} />

      {/* Graphique par type de financement */}
      <DestinationChart countryCode={countryCode} callYear={callYear} currentLang={currentLang} />

      {/* Cartes & Graphique par panel scientifique */}
      <MscaPanelCards countryCode={countryCode} callYear={callYear} />
      <PanelChart countryCode={countryCode} callYear={callYear} currentLang={currentLang} />
    </div>
  );
}
