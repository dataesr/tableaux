import { useQuery } from "@tanstack/react-query";

import { getData } from "./query";
import Options from "./options";
import { useGetParams } from "./utils";
import i18n from "./i18n.json";
import { getI18nLabel } from "../../../../../../utils";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import "./styles.scss";

interface PositioningScientificDomainTreemapProps {
  countryCode?: string;
  currentLang?: string;
}

const config = {
  id: "mscaPositioningScientificDomainTreemap",
  idQuery: "mscaPositioningScientificDomainTreemap",
  title: {
    en: getI18nLabel(i18n, "title", "en"),
    fr: getI18nLabel(i18n, "title", "fr"),
  },
  comment: {
    fr: <>{getI18nLabel(i18n, "comment", "fr")}</>,
    en: <>{getI18nLabel(i18n, "comment", "en")}</>,
  },
  readingKey: {
    fr: <>{getI18nLabel(i18n, "reading-key", "fr")}</>,
    en: <>{getI18nLabel(i18n, "reading-key", "en")}</>,
  },
  integrationURL: "/european-projects/components/pages/msca/charts/positioning-scientific-domain-treemap",
};

function PositioningScientificDomainTreemapInner({ currentLang: propLang }: PositioningScientificDomainTreemapProps) {
  const { params, currentLang: urlLang } = useGetParams();
  const currentLang = propLang || urlLang;

  const { data, isLoading } = useQuery({
    queryKey: ["mscaPositioningScientificDomainTreemap", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  if (data.length === 0) {
    return (
      <div className="fr-alert fr-alert--info">
        <p>{getI18nLabel(i18n, "no-data", currentLang)}</p>
      </div>
    );
  }

  const options = Options({
    data,
    currentLang,
  });

  const title = getI18nLabel(i18n, "chart-title", currentLang);
  config.title.fr = title;
  config.title.en = title;
  return (
    <div className="positioning-scientific-domain-treemap-chart">
      <div className="chart-container chart-container--default">
        <ChartWrapper config={config} options={options} />
      </div>
    </div>
  );
}

export default function PositioningScientificDomainTreemap({ countryCode, currentLang }: PositioningScientificDomainTreemapProps) {
  return <PositioningScientificDomainTreemapInner countryCode={countryCode} currentLang={currentLang} />;
}
