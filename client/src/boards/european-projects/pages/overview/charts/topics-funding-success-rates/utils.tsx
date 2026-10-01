import { useSearchParams } from "react-router-dom";
import { formatToRates } from "../../../../../../utils/format";
import { getI18nLabel } from "../../../../../../utils";
import { isEjoParam } from "../../../../utils/params";
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

  const currentLang = searchParams.get("language") || "fr";

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }

  return { params: params.join("&"), currentLang };
}

export function renderDataTable(data, currentLang) {
  if (!data) return null;

  const successRates = data.successRateByTopic || [];
  const rawData = data.data;

  const labels = {
    caption: getI18nLabel(i18n, "caption-topic-success-rate"),
    topic: getI18nLabel(i18n, "topic"),
    successRate: getI18nLabel(i18n, "success-rate"),
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
                  <th scope="col">{labels.topic}</th>
                  <th scope="col">{labels.successRate}</th>
                </tr>
              </thead>
              <tbody>
                {successRates.map((item) => {
                  // Essayer d'abord de trouver le nom dans successRateByTopic
                  let topicName = currentLang === "fr" ? item.thema_name_fr : item.thema_name_en;

                  // Si pas trouvé, chercher dans rawData
                  if (!topicName) {
                    const topicData = rawData.find((d) => d.topic === item.topic);
                    topicName = topicData ? (currentLang === "fr" ? topicData.thema_name_fr : topicData.thema_name_en) : item.topic;
                  }

                  return (
                    <tr key={item.topic}>
                      <th scope="row">{topicName}</th>
                      <td>{formatToRates(item.successRate)}</td>
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
