import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

// Passage du test : 
// node --test server/src/routes/boards/european-projects/routes/horizon-europe/overview/destination-funding/index.test.js

const endpoint = new URL("http://localhost:3000/api/european-projects/overview/destination-funding");
endpoint.search = new URLSearchParams({
  country_code: "FRA",
  range_of_years: "2021|2022|2023|2024|2025",
  isEjo: "false",
  pillarId: "HORIZON.2",
  programId: "HORIZON.2.6",
  thematicIds: "CLUSTER 6",
}).toString();

let expected;
let actual;

before(async () => {
  expected = JSON.parse(await readFile(new URL("./results.json", import.meta.url), "utf8"));
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, "La route doit répondre avec le statut 200");
  actual = await response.json();
});

function sortedByKeys(items, keys) {
  return [...items].sort((a, b) => {
    for (const key of keys) {
      const comparison = String(a[key]).localeCompare(String(b[key]));
      if (comparison !== 0) return comparison;
    }
    return 0;
  });
}

test("les financements par destination et étape correspondent à la référence", () => {
  assert.ok(Array.isArray(actual.data));
  assert.ok(actual.data.every((item, index, data) => index === 0 || data[index - 1].total_fund_eur >= item.total_fund_eur));
  assert.deepEqual(sortedByKeys(actual.data, ["destination", "stage"]), sortedByKeys(expected.data, ["destination", "stage"]));
});

test("les taux de succès par destination correspondent à la référence", () => {
  assert.ok(Array.isArray(actual.successRateByDestination));
  assert.deepEqual(sortedByKeys(actual.successRateByDestination, ["destination"]), sortedByKeys(expected.successRateByDestination, ["destination"]));
});
