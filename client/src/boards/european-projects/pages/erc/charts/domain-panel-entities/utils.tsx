import { useSearchParams } from "react-router-dom";
import { formatToMillions } from "../../../../../../utils/format";
import { isEjoParam } from "../../../../utils/params";
import { rangeOfYearsToApiFormat } from "../../url-utils";

export function useGetParams() {
  const [searchParams] = useSearchParams();
  const params: string[] = [];

  const countryCode = searchParams.get("country_code") || "FRA";
  params.push(`country_code=${countryCode}`);

  const rangeOfYears = searchParams.get("range_of_years");
  const callYear = rangeOfYearsToApiFormat(rangeOfYears);
  if (callYear) params.push(`call_year=${callYear}`);

  const currentLang = (searchParams.get("language") || "fr") as "fr" | "en";

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam());
  }

  return { params: params.join("&"), currentLang };
}

export function renderDataTable(data: { list: { acronym: string | null; name: string; total_fund_eur: number }[] }, currentLang: string) {
  if (!data?.list?.length) return null;
  const lang = currentLang as "fr" | "en";
  return (
    <table className="fr-table fr-table--sm">
      <caption>{lang === "fr" ? "Entités ERC par domaine / panel" : "ERC entities by domain / panel"}</caption>
      <thead>
        <tr>
          <th scope="col">{lang === "fr" ? "Acronyme" : "Acronym"}</th>
          <th scope="col">{lang === "fr" ? "Nom" : "Name"}</th>
          <th scope="col">{lang === "fr" ? "Financement (€)" : "Funding (€)"}</th>
        </tr>
      </thead>
      <tbody>
        {data.list.map((item, i) => (
          <tr key={i}>
            <td>{item.acronym || "—"}</td>
            <td>{item.name}</td>
            <td>{formatToMillions(item.total_fund_eur)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
