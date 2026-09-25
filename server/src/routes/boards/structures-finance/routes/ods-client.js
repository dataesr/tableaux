const DATASETS = {
  finance: "fr_esr_datasupr_finance",
  faq: "fr_esr_datasupr_finance-faq",
  definitions: "fr_esr_datasupr_finance-documentation-indicateur",
};

const PAGE_SIZE = 100;

function buildWhereClause(filters) {
  const conditions = [];
  for (const [fieldName, fieldValue] of Object.entries(filters)) {
    if (fieldValue == null) continue;
    if (fieldName === "$or") {
      const orConditions = fieldValue.map((condition) => {
        const [field, value] = Object.entries(condition)[0];
        return `\`${field}\`="${value}"`;
      });
      conditions.push(`(${orConditions.join(" OR ")})`);
    } else if (typeof fieldValue === "object" && fieldValue.$ne !== undefined) {
      conditions.push(`\`${fieldName}\` IS NOT NULL`);
    } else {
      conditions.push(`\`${fieldName}\`="${fieldValue}"`);
    }
  }
  return conditions.join(" AND ");
}

async function fetchRecords({
  dataset = "finance",
  select,
  where = {},
  groupBy,
  orderBy,
  limit = PAGE_SIZE,
  offset = 0,
}) {
  const datasetId = DATASETS[dataset] || dataset;
  const queryParams = new URLSearchParams();
  if (select?.length) queryParams.set("select", select.join(","));
  const whereClause = buildWhereClause(where);
  if (whereClause) queryParams.set("where", whereClause);
  if (groupBy?.length) queryParams.set("group_by", groupBy.join(","));
  if (orderBy) queryParams.set("order_by", orderBy);
  queryParams.set("limit", limit);
  queryParams.set("offset", offset);

  const response = await fetch(`${process.env.ODS_API_URL}/${datasetId}/records?${queryParams}`, {
    headers: { Authorization: `Apikey ${process.env.ODS_API_KEY}` },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ODS API error: ${response.status} - ${errorBody}`);
  }

  const jsonResponse = await response.json();
  return jsonResponse.results || [];
}

async function fetchAllRecords(options) {
  const allRecords = [];
  let currentOffset = 0;
  while (true) {
    const pageRecords = await fetchRecords({
      ...options,
      limit: PAGE_SIZE,
      offset: currentOffset,
    });
    allRecords.push(...pageRecords);
    if (pageRecords.length < PAGE_SIZE) break;
    currentOffset += PAGE_SIZE;
  }
  return allRecords;
}
async function getDistinctValues(fieldName, filters = {}, dataset = "finance") {
  const records = await fetchAllRecords({
    dataset,
    select: [fieldName],
    where: filters,
    groupBy: [fieldName],
    orderBy: `${fieldName} ASC`,
  });
  return records.map((record) => record[fieldName]).filter(Boolean);
}

export { fetchRecords, fetchAllRecords, getDistinctValues };

// DOC https://help.opendatasoft.com/apis/ods-explore-v2/#section/Introduction/Base-URL
