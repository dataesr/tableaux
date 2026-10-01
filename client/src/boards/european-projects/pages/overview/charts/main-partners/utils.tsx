import { useSearchParams } from "react-router-dom";
import { formatToMillions } from "../../../../../../utils/format";
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

  // Récupérer le paramètre thematicIds et l'ajouter comme topics s'il existe
  const thematicIds = searchParams.get("thematicIds");
  if (thematicIds) {
    params.push(`thematics=${thematicIds}`);
  }

  // Récupérer le paramètre destinationIds et l'ajouter comme destinations s'il existe
  const destinationIds = searchParams.get("destinationIds");
  if (destinationIds) {
    params.push(`destinations=${destinationIds}`);
  }

  // Récupérer le paramètre range_of_years et l'ajouter comme years s'il existe
  const rangeOfYears = searchParams.get("range_of_years");
  if (rangeOfYears) {
    params.push(`years=${rangeOfYears}`);
  }

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }
  // Ajouter le paramètre stage=successful
  // TODO: voir avec ZOE
  // params.push("stage=successful");

  return params.join("&");
}

export function getDefaultParams(searchParams) {
  const params = [...searchParams].map(([key, value]) => `${key}=${value}`).join("&");

  return params + "&stage=successful";
}

export function readingKey(data) {
  const rondomPartner = data?.list?.[Math.floor(Math.random() * data.list.length)];
  const partnerName = rondomPartner?.name || "unknown";
  const partnerAcronym = rondomPartner?.acronym || "unknown";
  const totalFundEur = rondomPartner?.total_fund_eur || 0;

  return {
    fr: (
      <>
        Dans le programme Horizon Europe,{" "}
        <strong>
          {partnerAcronym} ({partnerName})
        </strong>{" "}
        a reçu un financement total de <strong>{formatToMillions(totalFundEur)}</strong>.
      </>
    ),
    en: (
      <>
        In the Horizon Europe programme,{" "}
        <strong>
          {partnerAcronym} ({partnerName})
        </strong>{" "}
        received a total of <strong>{formatToMillions(totalFundEur)}</strong> in grants.
      </>
    ),
  };
}

/**
 * Génère un composant de tableau accessible avec les données des principaux bénéficiaires
 * @param data - Les données des principaux bénéficiaires
 * @param currentLang - La langue actuelle ('fr' ou 'en')
 * @returns Un composant JSX de tableau accessible ou un message si aucune donnée n'est disponible
 */
export function renderDataTable(data: { list: Array<{ id: string; name: string; acronym: string; country_name: string; total_fund_eur: number }> }, currentLang: string = "fr") {
  if (!data || !data.list || data.list.length === 0) {
    return <div className="fr-text--center fr-py-3w">{getI18nLabel(i18n, "no-data-table")}</div>;
  }

  const formatToMillions = (value: number) => {
    const millions = value / 1000000;
    const locale = currentLang === "fr" ? "fr-FR" : "en-US";
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(millions);
  };

  const labels = {
    partner: getI18nLabel(i18n, "beneficiary"),
    acronym: getI18nLabel(i18n, "acronym"),
    funding: getI18nLabel(i18n, "total-funding"),
    unit: "M€",
    caption: currentLang === "fr" ? "Liste des principaux bénéficiaires récupérant 50% des financements (en millions d'euros)" : "List of main beneficiaries receiving 50% of funding (in millions of euros)",
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="fr-table-responsive">
        <table className="fr-table fr-table--bordered fr-table--sm" style={{ width: "100%" }}>
          <caption className="fr-sr-only">{labels.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{labels.acronym}</th>
              <th scope="col">{labels.partner}</th>
              <th scope="col">{labels.funding}</th>
            </tr>
          </thead>
          <tbody>
            {data.list.map((item, index) => (
              <tr key={item.id || index}>
                <th scope="row">{item.acronym || "—"}</th>
                <td>{item.name}</td>
                <td>
                  <strong>
                    {formatToMillions(item.total_fund_eur)} {labels.unit}
                  </strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
