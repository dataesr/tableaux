import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { GetData } from "./query";
import { getDefaultParams } from "./utils";
import { RenderData } from "./render-data";
import options from "./options";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useChartColor } from "../../../../../../hooks/useChartColor";
import { EPChartsSources } from "../../../../config";
import { COUNTRY_MAPPING } from "../../../../utils/country-mapping";

import i18n from "./i18n.json";

export default function Top10CountriesByTypeOfBeneficiaries() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const params = getDefaultParams(searchParams);
  const color = useChartColor();

  const { data, isLoading } = useQuery({
    queryKey: ["top10CountriesByTypeOfBeneficiaries", params],
    queryFn: () => GetData(params),
    enabled: !!params,
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  const countryCode = data?.data?.[0]?.country_code || searchParams.get("country_code") || "";
  const countryInfo = COUNTRY_MAPPING[countryCode];

  // Nom avec article en français ("La France"), nom seul en anglais ("France")
  const countryNameFr = countryInfo?.name?.fr || data?.data?.[0]?.country_name_fr || countryCode;
  const countryNameEn = countryInfo?.name?.en || data?.data?.[0]?.country_name_en || countryCode;

  // Version en minuscule de l'article pour usage en milieu de phrase ("la France", "l'Allemagne"…)
  const countryNameFrLower = countryNameFr.charAt(0).toLowerCase() + countryNameFr.slice(1);

  // Clé de lecture : type dominant
  const types = data?.data?.[0]?.types || [];
  const dominant = types.reduce((max, t) => (t.total_fund_eur > (max?.total_fund_eur ?? 0) ? t : max), null);
  const dominantLabel = dominant ? getI18nLabel(dominant.cordis_type_entity_code) : "";
  const dominantAmount = dominant
    ? new Intl.NumberFormat(currentLang === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 0 }).format(dominant.total_fund_eur / 1_000_000)
    : "";

  const config = {
    id: "top10beneficiaries",
    title: {
      fr: "Financements obtenus par type d'entités (en millions d'euros)",
      en: "Funding obtained by type of entities (in millions of euros)",
    },
    comment: {
      fr: (
        <>
          Ce graphique présente la répartition des subventions Horizon Europe obtenus par <strong>{countryNameFrLower}</strong> selon le type d'entités bénéficiaires : organismes de recherche (REC), organismes publics (PUB), entreprises privées
          (PRC), établissements d'enseignement supérieur (HES) et autres (OTH). Les montants sont exprimés en millions d'euros.
        </>
      ),
      en: (
        <>
          This chart shows the distribution of Horizon Europe grants obtained by <strong>{countryNameEn}</strong> by type of beneficiary entity: research organisations (REC), public bodies (PUB), private companies (PRC), higher education institutions
          (HES) and others (OTH). Amounts are expressed in millions of euros.
        </>
      ),
    },
    readingKey: {
      fr: (
        <>
          Pour <strong>{countryNameFrLower}</strong>, le type d'entité ayant reçu le plus de financements est <strong>{dominantLabel}</strong> avec <strong>{dominantAmount} M€</strong> alloués.
        </>
      ),
      en: (
        <>
          For <strong>{countryNameEn}</strong>, the entity type receiving the most Horizon Europe funding is <strong>{dominantLabel}</strong> with <strong>{dominantAmount} M€</strong> awarded.
        </>
      ),
    },
    sources: EPChartsSources,
    integrationURL: "",
  };

  return (
    <div className={`chart-container chart-container--${color}`}>
      <ChartWrapper config={config} options={options(data, currentLang)} renderData={() => RenderData(data, currentLang)} />
    </div>
  );
}
