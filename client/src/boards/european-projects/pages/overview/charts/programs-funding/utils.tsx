import { useSearchParams } from "react-router-dom";
import { formatToMillions, formatToRates } from "../../../../../../utils/format";
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

  const currentLang = searchParams.get("language") || "fr";

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }

  return { params: params.join("&"), currentLang };
}

export function renderDataTable(data, currentLang) {
  if (!data) return null;

  const rawData = data.data;
  const evaluatedData = rawData.filter((item) => item.stage === "evaluated");
  const successfulData = rawData.filter((item) => item.stage === "successful");

  const labels = {
    caption: getI18nLabel(i18n, "funding-by-program"),
    program: getI18nLabel(i18n, "program"),
    evaluated: getI18nLabel(i18n, "evaluated"),
    successful: getI18nLabel(i18n, "successful"),
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
                  <th scope="col">{labels.program}</th>
                  <th scope="col">{labels.evaluated}</th>
                  <th scope="col">{labels.successful}</th>
                </tr>
              </thead>
              <tbody>
                {evaluatedData.map((evalItem) => {
                  const programName = currentLang === "fr" ? evalItem.programme_name_fr : evalItem.programme_name_en;
                  const successItem = successfulData.find((item) => item.program === evalItem.program);

                  const evaluatedValue = evalItem.total_fund_eur || 0;
                  const successfulValue = successItem?.total_fund_eur || 0;

                  return (
                    <tr key={evalItem.program}>
                      <th scope="row">{programName}</th>
                      <td>{formatToMillions(evaluatedValue)}</td>
                      <td>{formatToMillions(successfulValue)}</td>
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

export function readingKey(data, isLoading) {
  if (isLoading || !data) {
    return { fr: <></>, en: <></> };
  }

  const rawData = data.data;
  const successRates = data.successRateByProgram || [];

  // Identifier le programme avec le taux de succès le plus élevé
  const bestProgram = successRates.reduce((max, current) => (current.successRate > max.successRate ? current : max), successRates[0]);

  // Récupérer les informations du programme avec le meilleur taux
  const bestProgramEvaluated = rawData.find((item) => item.program === bestProgram.program && item.stage === "evaluated");
  const bestProgramSuccessful = rawData.find((item) => item.program === bestProgram.program && item.stage === "successful");

  if (!bestProgramEvaluated || !bestProgramSuccessful) {
    return { fr: <></>, en: <></> };
  }

  const programNameFr = bestProgramEvaluated.programme_name_fr;
  const programNameEn = bestProgramEvaluated.programme_name_en;
  const evaluatedFunding = bestProgramEvaluated.total_fund_eur || 0;
  const successfulFunding = bestProgramSuccessful.total_fund_eur || 0;
  const evaluatedCount = bestProgramEvaluated.count || 0;
  const successfulCount = bestProgramSuccessful.count || 0;
  const successRate = bestProgram.successRate;

  const fr = (
    <>
      Le programme <strong>{programNameFr}</strong> présente le meilleur taux de succès avec <strong>{formatToRates(successRate)}</strong>. Sur les <strong>{evaluatedCount}</strong> projets évalués représentant{" "}
      <strong>{formatToMillions(evaluatedFunding)}</strong> de financement demandé,
      <strong> {successfulCount}</strong> projets ont été lauréats pour un montant total de <strong>{formatToMillions(successfulFunding)}</strong>.
    </>
  );

  const en = (
    <>
      The <strong>{programNameEn}</strong> program has the highest success rate at <strong>{formatToRates(successRate)}</strong>. Out of <strong>{evaluatedCount}</strong> evaluated projects representing{" "}
      <strong>{formatToMillions(evaluatedFunding)}</strong> in requested funding, <strong>{successfulCount}</strong> projects were successful for a total amount of <strong>{formatToMillions(successfulFunding)}</strong>.
    </>
  );

  return {
    fr: fr,
    en: en,
  };
}
