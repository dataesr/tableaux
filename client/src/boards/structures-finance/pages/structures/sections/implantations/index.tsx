import { useMemo } from "react";
import { Title, Row, Col, Text } from "@dataesr/dsfr-plus";
import CardSimple from "../../../../../../components/card-simple";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCssColor } from "../../../../../../utils/colors";
import "../styles.scss";
import MetricDefinitionsTable from "../../../../components/metric-definitions/metric-definitions-table";
import SectionYearSelect from "../../../../../../components/section-year-select";

interface ImplantationsSectionProps {
  data: any;
}

const toNumber = (value: unknown): number | null => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normalizeLatLon = (maybeLat: unknown, maybeLon: unknown): { lat: number; lon: number } | null => {
  const lat = toNumber(maybeLat);
  const lon = toNumber(maybeLon);
  if (lat == null || lon == null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
};

const parseCoordString = (value: string): { lat: number; lon: number } | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return extractCoordinates(JSON.parse(trimmed));
  } catch {
    const parts = trimmed.split(/[;,\s]+/).map((v) => v.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const a = toNumber(parts[0]);
      const b = toNumber(parts[1]);
      if (a != null && b != null) return normalizeLatLon(a, b) || normalizeLatLon(b, a);
    }
  }
  return null;
};

const extractCoordinates = (source: any): { lat: number; lon: number } | null => {
  if (!source) return null;
  if (typeof source === "string") return parseCoordString(source);
  if (Array.isArray(source) && source.length >= 2) {
    const [first, second] = [toNumber(source[0]), toNumber(source[1])];
    if (first != null && second != null) return normalizeLatLon(first, second) || normalizeLatLon(second, first);
  }
  return (
    normalizeLatLon(source.lat, source.lon) ||
    normalizeLatLon(source.latitude, source.longitude) ||
    normalizeLatLon(source.y, source.x) ||
    normalizeLatLon(source.geo_lat, source.geo_lon) ||
    (source.gps ? parseCoordString(source.gps) : null) ||
    (source.coordonnees ? extractCoordinates(source.coordonnees) : null) ||
    (source.coordinates ? extractCoordinates(source.coordinates) : null)
  );
};

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  return null;
}

export function ImplantationsSection({ data }: ImplantationsSectionProps) {
  if (!data?.implantations || !Array.isArray(data.implantations) || data.implantations.length === 0) return null;

  const points = useMemo(() => {
    const fromImplantations = (data.implantations as any[])
      .map((implantation: any, index: number) => {
        const coords = extractCoordinates(implantation);
        if (!coords) return null;
        return {
          id: String(implantation.implantation_id || index),
          name: implantation.implantation || `Implantation ${index + 1}`,
          lat: coords.lat,
          lon: coords.lon,
          effectif: implantation.effectif_sans_cpge as number | null,
          partEffectif: implantation.part_effectif_sans_cpge as number | null,
          siege: Boolean(implantation.siege),
        };
      })
      .filter(Boolean) as {
        id: string;
        name: string;
        lat: number;
        lon: number;
        effectif: number | null;
        partEffectif: number | null;
        siege: boolean;
      }[];

    const unique = Array.from(
      new Map(fromImplantations.map((p) => [`${p.name}-${p.lat.toFixed(6)}-${p.lon.toFixed(6)}`, p])).values()
    );
    if (unique.length > 0) return unique;

    const fallback = extractCoordinates(data);
    if (fallback) return [{ id: "main", name: data?.etablissement_lib || "Établissement", lat: fallback.lat, lon: fallback.lon, effectif: data?.effectif_sans_cpge ?? null, partEffectif: null, siege: true }];
    return [];
  }, [data]);

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (points.length === 0) return null;
    return points.map((p) => [p.lat, p.lon] as LatLngTuple) as LatLngBoundsExpression;
  }, [points]);

  return (
    <section id="section-implantations" aria-labelledby="section-implantations-title" className="section-container">
      <div className="section-header section-header--year fr-mb-4w">
        <Title as="h2" look="h5" id="section-implantations-title" className="section-header__title">
          Implantations géographiques
        </Title>
        <SectionYearSelect />
      </div>

      {points.length > 0 && bounds && (
        <Row className="fr-mb-4w">
          <Col xs="12">
            <MapContainer className="implantations-map" bounds={bounds} scrollWheelZoom={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds bounds={bounds} />
              {points.map((point) => (
                <CircleMarker
                  key={point.id}
                  center={[point.lat, point.lon]}
                  radius={point.siege ? 10 : 7}
                  pathOptions={{
                    fillColor: point.siege ? getCssColor("yellow-moutarde") : getCssColor("blue-france"),
                    fillOpacity: 0.9,
                    color: getCssColor("beige-gris-galet"),
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="implantations-map__popup">
                      {point.siege && <Text className="fr-text--sm">Site principal</Text>}
                      <Text className="fr-text--sm fr-mb-0" >{point.name}</Text>
                      <Text className="fr-text--xs fr-mb-0" style={{ color: "var(--text-mention-grey)" }}>
                        {point.effectif != null ? `${Number(point.effectif).toLocaleString("fr-FR")} étudiants` : "Effectif non renseigné"}
                      </Text>
                      {point.partEffectif != null && (
                        <Text className="fr-text--xs fr-mb-0" style={{ color: "var(--text-mention-grey)" }}>
                          {point.partEffectif.toFixed(1)} % des étudiants
                        </Text>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
            <Row gutters className="fr-mt-1w fr-text--sm">
              <div className="fr-col">
                <span className="implantations-map__legend-dot implantations-map__legend-dot--siege" aria-hidden="true" />
                Site principal
                <span className="implantations-map__legend-dot implantations-map__legend-dot--site" aria-hidden="true" />
                Site secondaire
              </div>
            </Row>
          </Col>
        </Row>
      )}

      <Row gutters>
        {data.implantations.map((implantation: any, index: number) => (
          <Col key={implantation.implantation_id || index} xs="12" md="6" lg="4">
            <CardSimple
              bottomText={implantation.part_effectif_sans_cpge ? `${implantation.part_effectif_sans_cpge.toFixed(1)} % de l'ensemble des étudiants inscrits` : undefined}
              description={implantation.siege ? "Site principal" : ""}
              stat={implantation.effectif_sans_cpge}
              title={implantation.implantation}
              year={data.anuniv}
              as="h3"
            />
          </Col>
        ))}
      </Row>
      <MetricDefinitionsTable metricKeys={["nb_sites"]} />
    </section>
  );
}
