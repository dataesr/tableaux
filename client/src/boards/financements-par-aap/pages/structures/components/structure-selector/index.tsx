import { Badge, Col, Row } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { useEffect, useState } from "react";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import Select from "../../../../../../components/select";
import { getEsQuery } from "../../../../utils.ts";

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env;


export default function StructureSelector({ setStructures }) {
  const [region, setRegion] = useState("*");
  const [searchParams, setSearchParams] = useSearchParams({});
  const [searchQuery, setSearchQuery] = useState("");
  const [typology, setTypology] = useState("*");

  const bodyRegions: any = {
    ...getEsQuery({}),
    aggregations: {
      by_region: {
        terms: {
          field: "address.region.keyword",
          order: { _key: "asc" },
          size: 30,
        },
      },
    },
  };
  bodyRegions.query.bool.filter.push({ term: { participant_is_main_parent: 1 } });
  bodyRegions.query.bool.filter.push({ term: { participant_type: "institution" } });
  bodyRegions.query.bool.filter.push({ terms: { "participant_typologie_1.keyword": ["Ecoles, instituts et assimilés", "Organismes de recherche", "Universités et assimilés"] } });
  if (typology) {
    bodyRegions.query.bool.filter.push({ wildcard: { "participant_typologie_1.keyword": typology } });
  }
  const { data: dataRegions, isLoading: isLoadingRegions } = useQuery({
    queryKey: ["fundings-regions", typology],
    queryFn: () =>
      fetch(
        `${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`,
        {
          body: JSON.stringify(bodyRegions),
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      ).then((response) => response.json()),
  });
  const regions = (dataRegions?.aggregations?.by_region?.buckets ?? [])
    .map((bucket) => bucket.key)
    .sort((a, b) => a.localeCompare(b));

  const bodyTypologies: any = {
    ...getEsQuery({}),
    aggregations: {
      by_typology: {
        terms: {
          field: "participant_typologie_1.keyword",
          order: { _key: "desc" },
        },
      },
    },
  };
  bodyTypologies.query.bool.filter.push({ term: { participant_is_main_parent: 1 } });
  bodyTypologies.query.bool.filter.push({ term: { participant_type: "institution" } });
  bodyTypologies.query.bool.filter.push({ terms: { "participant_typologie_1.keyword": ["Ecoles, instituts et assimilés", "Organismes de recherche", "Universités et assimilés"] } });
  if (region) {
    bodyTypologies.query.bool.filter.push({ wildcard: { "address.region.keyword": region } });
  }
  const { data: dataTypologies, isLoading: isLoadingTypologies } = useQuery({
    queryKey: ["fundings-typologies", region],
    queryFn: () =>
      fetch(
        `${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`,
        {
          body: JSON.stringify(bodyTypologies),
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      ).then((response) => response.json()),
  });
  const typologies = (dataTypologies?.aggregations?.by_typology?.buckets ?? []).map((bucket) => bucket.key);

  const bodyStructures: any = {
    ...getEsQuery({}),
    aggregations: {
      by_structure: {
        terms: {
          field: "participant_encoded_key",
          size: 1500,
        },
      },
    },
  };
  bodyStructures.query.bool.filter.push({ term: { participant_is_main_parent: 1 } });
  bodyStructures.query.bool.filter.push({ term: { participant_type: "institution" } });
  bodyStructures.query.bool.filter.push({ terms: { "participant_typologie_1.keyword": ["Ecoles, instituts et assimilés", "Organismes de recherche", "Universités et assimilés"] } });
  if (region) {
    bodyStructures.query.bool.filter.push({ wildcard: { "address.region.keyword": region } });
  }
  if (typology) {
    bodyStructures.query.bool.filter.push({ wildcard: { "participant_typologie_1.keyword": typology } });
  }
  const { data: dataStructures, isLoading: isLoadingStructures } = useQuery({
    queryKey: ["fundings-structures", region, typology],
    queryFn: () =>
      fetch(
        `${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`,
        {
          body: JSON.stringify(bodyStructures),
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      ).then((response) => response.json()),
  });

  const structures =
    (dataStructures?.aggregations?.by_structure?.buckets ?? []).map((bucket) => {
      const structureInfo = Object.fromEntries(new URLSearchParams(bucket?.key ?? ""));
      structureInfo.searchableText = structureInfo.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return structureInfo;
    }) || [];

  const handleStructureChange = (selectedStructure?: string) => {
    if (selectedStructure) {
      searchParams.set("structureId", selectedStructure);
      searchParams.delete("region")
      setSearchParams(searchParams);
    }
  };

  useEffect(() => {
    setStructures((dataStructures?.aggregations?.by_structure?.buckets ?? []).map((bucket) => {
      const structureInfo = Object.fromEntries(new URLSearchParams(bucket?.key ?? ""));
      structureInfo.searchableText = structureInfo.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return structureInfo;
    }) || []);
  }, [dataStructures])

  return (
    <Row gutters className="fr-grid-row--middle">
      <Col xs="12" sm="3">
        {isLoadingRegions ? <DefaultSkeleton /> : (
          <Select
            label={region === "*" ? <>Région <Badge className="fr-ml-1v" size="sm">{regions.length}</Badge></> : region}
            icon="map-pin-2-line"
            size="sm"
            fullWidth
            aria-label="Filtrer par région"
          >
            <Select.Option
              value="*"
              selected={region === "*"}
              onClick={() => setRegion("*")}
            >
              Toutes les régions
            </Select.Option>
            {regions.map((c: string) => (
              <Select.Option
                key={c}
                value={c}
                selected={region === c}
                onClick={() => setRegion(c)}
              >
                {c}
              </Select.Option>
            ))}
          </Select>
        )}
      </Col>

      <Col xs="12" sm="3">
        {isLoadingTypologies ? <DefaultSkeleton height="40px" /> : (
          <Select
            label={typology === "*" ? <>Typologie <Badge className="fr-ml-1v" size="sm">{typologies.length}</Badge></> : typology}
            icon="layout-grid-line"
            size="sm"
            fullWidth
            aria-label="Filtrer par typologie"
          >
            <Select.Option
              value="*"
              selected={typology === "*"}
              onClick={() => setTypology("*")}
            >
              Toutes les typologies
            </Select.Option>
            {typologies.map((t: string) => (
              <Select.Option
                key={t}
                value={t}
                selected={typology === t}
                onClick={() => setTypology(t)}
              >
                {t}
              </Select.Option>
            ))}
          </Select>
        )}
      </Col>

      <Col xs="12" sm="6">
        {isLoadingStructures ? <DefaultSkeleton height="40px" /> : (
          <Select
            label={<>Établissement <Badge className="fr-ml-1v" size="sm">{structures.length}</Badge></>}
            icon="search-line"
            size="sm"
            fullWidth
            aria-label="Rechercher un établissement"
          >
            <Select.Search
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select.Content maxHeight="300px">
              {structures
                .filter((s) =>
                  searchQuery
                    ? s.searchableText.includes(searchQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
                    : true
                )
                .map((s) => (
                  <Select.Option
                    key={s.id}
                    value={s.id}
                    onClick={() => handleStructureChange(s.id)}
                  >
                    {s.label}
                  </Select.Option>
                ))}
              {structures
                .filter((s) =>
                  searchQuery
                    ? s.searchableText.includes(searchQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
                    : true
                )
                .length === 0 && (
                  <Select.Empty>Aucun établissement trouvé</Select.Empty>
                )}
            </Select.Content>
          </Select>
        )}
      </Col>
    </Row>
  );
}
