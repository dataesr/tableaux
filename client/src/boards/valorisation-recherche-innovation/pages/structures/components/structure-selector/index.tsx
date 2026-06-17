import { Badge, Col, Row } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { useEffect, useState } from "react";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import SearchableSelect from "../../../../../../components/searchable-select/index.tsx";
import { getEsQueryStartups } from "../../../../utils.ts";

const { VITE_APP_ES_INDEX_ORGANIZATIONS, VITE_APP_SERVER_URL } = import.meta.env;


export default function StructureSelector({ setStructures }) {
  const [county, setCounty] = useState("*");
  const [typology, setTypology] = useState("*");
  const [searchParams, setSearchParams] = useSearchParams({});
  const structure = searchParams.get("structureId") ?? "";

  const bodyCounties: any = {
    ...getEsQueryStartups({}),
    aggregations: {
      by_county: {
        terms: {
          field: "startup_links.denormalized.mainAddress.region.keyword",
          order: { _key: "asc" },
          size: 30,
        },
      },
    },
  };
  if (typology) {
    bodyCounties.query.bool.filter.push({ wildcard: { "startup_links.denormalized.typologie_1.keyword": typology } });
  }
  const { data: dataCounties, isLoading: isLoadingCounties } = useQuery({
    queryKey: ["valo-counties", typology],
    queryFn: () =>
      fetch(
        `${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_ORGANIZATIONS}`,
        {
          body: JSON.stringify(bodyCounties),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          method: "POST",
        }
      ).then((response) => response.json()),
  });
  const counties = (dataCounties?.aggregations?.by_county?.buckets ?? [])
    .map((bucket) => bucket.key)
    .sort((a, b) => a.localeCompare(b));

  const bodyTypologies: any = {
    ...getEsQueryStartups({}),
    aggregations: {
      by_typology: {
        terms: {
          field: "startup_links.denormalized.typologie_1.keyword",
          order: { _key: "desc" },
        },
      },
    },
  };
  if (county) {
    bodyTypologies.query.bool.filter.push({ wildcard: { "startup_links.denormalized.mainAddress.region.keyword": county } });
  }
  const { data: dataTypologies, isLoading: isLoadingTypologies } = useQuery({
    queryKey: ["valo-typologies", county],
    queryFn: () =>
      fetch(
        `${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_ORGANIZATIONS}`,
        {
          body: JSON.stringify(bodyTypologies),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          method: "POST",
        }
      ).then((response) => response.json()),
  });
  const typologies = (dataTypologies?.aggregations?.by_typology?.buckets ?? [])
    .map((bucket) => bucket.key);

  const bodyStructures: any = {
    ...getEsQueryStartups({}),
    aggregations: {
      by_structure: {
        terms: {
          field: "startup_links.denormalized.encoded_key.keyword",
          size: 3000,
        },
      },
    },
  };
  if (county) {
    bodyStructures.query.bool.filter.push({ wildcard: { "startup_links.denormalized.mainAddress.region.keyword": county } });
  }
  if (typology) {
    bodyStructures.query.bool.filter.push({ wildcard: { "startup_links.denormalized.typologie_1.keyword": typology } });
  }
  const { data: dataStructures, isLoading: isLoadingStructures } = useQuery({
    queryKey: ["valo-structures", county, typology],
    queryFn: () =>
      fetch(
        `${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_ORGANIZATIONS}`,
        {
          body: JSON.stringify(bodyStructures),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          method: "POST",
        }
      ).then((response) => response.json()),
  });

  const structures =
    (dataStructures?.aggregations?.by_structure?.buckets ?? []).map((bucket) => {
      const structureInfo = Object.fromEntries(new URLSearchParams(bucket.key));
      structureInfo.value = structureInfo.id;
      structureInfo.searchableText = structureInfo.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return structureInfo;
    });

  const handleStructureChange = (selectedStructure?: string) => {
    if (selectedStructure) {
      searchParams.set("structureId", selectedStructure);
      setSearchParams(searchParams);
    }
  };

  useEffect(() => {
    setStructures((dataStructures?.aggregations?.by_structure?.buckets ?? []).map((bucket) => {
      const structureInfo = Object.fromEntries(new URLSearchParams(bucket.key));
      structureInfo.value = structureInfo.id;
      structureInfo.searchableText = structureInfo.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return structureInfo;
    }));
  }, [dataStructures])

  return (
    <Row gutters>
      <Col xs="12" sm="3">
        {isLoadingCounties ? <DefaultSkeleton height="70px" /> : (
          <div className="fr-select-group">
            <label className="fr-label">
              Région
              <Badge className="fr-ml-1w">
                {counties.length}
              </Badge>
            </label>
            <select
              aria-describedby="select-county-messages"
              className="fr-select"
              id="select-county"
              name="select-county"
              onChange={(e) => setCounty(e.target.value)}
              value={county}
            >
              <option value="*">Toutes les régions</option>
              {counties.map((county: string) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </div>
        )}
      </Col>

      <Col xs="12" sm="3">
        {isLoadingTypologies ? <DefaultSkeleton height="70px" /> : (
          <div className="fr-select-group">
            <label className="fr-label">
              Typologie
              <Badge className="fr-ml-1w">
                {typologies.length}
              </Badge>
            </label>
            <select
              aria-describedby="select-typology-messages"
              className="fr-select"
              id="select-typology"
              name="select-typology"
              onChange={(e) => setTypology(e.target.value)}
              value={typology}
            >
              <option value="*">Toutes les typologies</option>
              {typologies.map((typology: string) => (
                <option key={typology} value={typology}>
                  {typology}
                </option>
              ))}
            </select>
          </div>
        )}
      </Col>

      <Col xs="12" sm="6">
        {isLoadingStructures ? <DefaultSkeleton height="70px" /> : (
          <>
            <label className="fr-label">
              Etablissement
              <Badge className="fr-ml-1w">
                {structures.length}
              </Badge>
            </label>
            <div className="fr-mt-1w fr-mb-1w">
              <SearchableSelect
                onChange={handleStructureChange}
                options={structures}
                placeholder="Rechercher un établissement..."
                value={structure}
              />
            </div>
          </>
        )}
      </Col>
    </Row>
  );
}
