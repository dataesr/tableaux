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

  // Récupérer le paramètre thematicIds et l'ajouter comme thematics s'il existe
  const thematicIds = searchParams.get("thematicIds");
  if (thematicIds) {
    params.push(`thematics=${thematicIds}`);
  }

  // Récupérer le paramètre destinationIds et l'ajouter comme destinations s'il existe
  const destinationIds = searchParams.get("destinationIds");
  if (destinationIds) {
    params.push(`destinations=${destinationIds}`);
  }

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }

  // Ajouter le paramètre stage par défaut
  params.push("stage=successful");

  return params.join("&");
}

export function readingKey(data) {
  if (!data?.top10 || data.top10.length === 0) {
    return {
      fr: <></>,
      en: <></>,
    };
  }

  const topCountry = data.top10[0];
  const secondCountry = data.top10.length > 1 ? data.top10[1] : null;
  const tenthCountry = data.top10.length >= 10 ? data.top10[9] : data.top10[data.top10.length - 1];

  return {
    fr: (
      <>
        Le pays "{topCountry.name_fr}" se place en 1ère position du classement avec <strong>{formatToMillions(topCountry.total_fund_eur)}</strong> de subventions reçues
        {secondCountry && (
          <>
            , suivi par "{secondCountry.name_fr}" avec <strong>{formatToMillions(secondCountry.total_fund_eur)}</strong>
          </>
        )}
        . {data.top10.length >= 10 ? "Les 10 premiers" : `Les ${data.top10.length}`} bénéficiaires représentent <strong>{tenthCountry.influence?.toFixed(1)}%</strong> du cumul total des subventions allouées.
      </>
    ),
    en: (
      <>
        The country "{topCountry.name_en}" ranks 1st with <strong>{formatToMillions(topCountry.total_fund_eur)}</strong> in subsidies received
        {secondCountry && (
          <>
            , followed by "{secondCountry.name_en}" with <strong>{formatToMillions(secondCountry.total_fund_eur)}</strong>
          </>
        )}
        . The top {data.top10.length >= 10 ? "10" : data.top10.length} beneficiaries represent <strong>{tenthCountry.influence?.toFixed(1)}%</strong> of the cumulative total subsidies allocated.
      </>
    ),
  };
}

export function renderDataTable(data, currentLang, selectedCountryCode) {
  if (!data || data.length === 0) return null;

  const labels = {
    caption: getI18nLabel(i18n, "caption-top-10-beneficiaries"),
    rank: getI18nLabel(i18n, "rank"),
    country: getI18nLabel(i18n, "country"),
    funding: getI18nLabel(i18n, "total-subsidies"),
    influence: getI18nLabel(i18n, "cumulative-weight-percent"),
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
                  <th scope="col">{labels.rank}</th>
                  <th scope="col">{labels.country}</th>
                  <th scope="col">{labels.funding}</th>
                  <th scope="col">{labels.influence}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const countryName = currentLang === "fr" ? item.name_fr : item.name_en;
                  const isSelectedCountry = item.id === selectedCountryCode;

                  return (
                    <tr key={item.id} style={isSelectedCountry ? { fontWeight: "bold" } : undefined}>
                      <th scope="row">{index + 1}</th>
                      <td>{countryName}</td>
                      <td>{formatToMillions(item.total_fund_eur)}</td>
                      <td>{item.influence?.toFixed(1)} %</td>
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
