import { isEjoParam } from "../../../../utils/params";

export function getDefaultParams(searchParams) {
  const params: string[] = [];

  const countryCode = searchParams.get("country_code");
  if (countryCode) params.push(`country_code=${countryCode}`);

  const pillarId = searchParams.get("pillarId");
  if (pillarId) params.push(`pillars=${pillarId}`);

  const programId = searchParams.get("programId");
  if (programId) params.push(`programs=${programId}`);

  const thematicIds = searchParams.get("thematicIds");
  if (thematicIds) params.push(`thematics=${thematicIds}`);

  const destinationIds = searchParams.get("destinationIds");
  if (destinationIds) params.push(`destinations=${destinationIds}`);

  const rangeOfYears = searchParams.get("range_of_years");
  if (rangeOfYears) params.push(`years=${rangeOfYears}`);

  if (searchParams.has("isEjo")) params.push(isEjoParam());

  params.push("stage=successful");

  return params.filter((item) => !!item).join("&");
}