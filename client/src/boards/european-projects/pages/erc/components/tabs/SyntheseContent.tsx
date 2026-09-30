import { useSearchParams } from "react-router-dom";
import { ErcSynthesisCards, ErcDestinationCards, ErcPanelCards } from "../../../../components/cards/erc";
import { getCountryAdjectives } from "../../../../../../components/country-selector/utils";
import { rangeOfYearsToApiFormat } from "../../url-utils";
import { getI18nLabel } from "../../../../../../utils";
import PanelFundingChart from "../../charts/panel-funding";
import DestinationChart from "../../charts/destination-chart";
import PanelChart from "../../charts/panel-chart";
import PanelDetailChart from "../../charts/panel-detail-chart";
import i18n from "../../i18n.json";
import { Title } from "@dataesr/dsfr-plus";

export default function SyntheseContent() {
  const [searchParams] = useSearchParams();

  // Récupérer les paramètres de filtres depuis l'URL
  const countryCode = searchParams.get("country_code") || "FRA";
  const rangeOfYears = searchParams.get("range_of_years");
  const callYear = rangeOfYearsToApiFormat(rangeOfYears);
  const currentLang = searchParams.get("language") || "fr";

  // Adjectifs de nationalité (masculin et féminin)
  const countryAdj = getCountryAdjectives(countryCode);

  return (
    <div>
      <h2 className="fr-mb-3w">{getI18nLabel(i18n, "page.title", currentLang)}</h2>
      {/* Cartes de synthèse principales */}
      <ErcSynthesisCards countryCode={countryCode} callYear={callYear} countryAdj={countryAdj} />
      {/* Cartes par type de financement */}
      <ErcDestinationCards countryCode={countryCode} callYear={callYear} />
      {/* Graphique par type de financement */}
      <DestinationChart countryCode={countryCode} callYear={callYear} currentLang={currentLang} />
      {/* Cartes par panel ERC */}
      <Title as="h3" className="fr-mt-4w">
        {getI18nLabel(i18n, "panelFunding.sectionTitle", currentLang)}
      </Title>
      <ErcPanelCards countryCode={countryCode} callYear={callYear} />
      {/* Graphique par panel ERC */}
      <PanelChart countryCode={countryCode} callYear={callYear} currentLang={currentLang} />
      {/* Graphique détaillé par panel ERC */}
      <PanelDetailChart countryCode={countryCode} callYear={callYear} currentLang={currentLang} />
      <PanelFundingChart countryAdjective={countryAdj.m} currentLang={currentLang} />
      {/* TODO: Graph de performance avec croisement d'indicateurs Par panel, type de financement */}
      {/* TODO: Stats par type de financement + genre du porteur + tranche age du porteur */}
    </div>
  );
}
