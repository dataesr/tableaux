import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Col, Row, Title } from "@dataesr/dsfr-plus";

import { getData } from "./query.js";
import options, { FRAMEWORKS_ORDER, FRAMEWORK_LABELS, AXIS_VARIABLES, VARIABLE_CONFIG, type AxisVariable } from "./options.js";
import { useGetParams, readingKey, renderDataTable } from "./utils.js";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useChartColor } from "../../../../../../hooks/useChartColor";
import { EPChartsSources } from "../../../../config.js";

import { getI18nLabel } from "../../../../../../utils";
import i18n from "./i18n.json";
import "./styles.scss";

export default function EfficiencyScatter() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const params = useGetParams();
  const color = useChartColor();

  // États pour l'animation
  const [currentFrameworkIndex, setCurrentFrameworkIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // États pour les sélecteurs d'axes
  const [xAxisVar, setXAxisVar] = useState<AxisVariable>("success_rate_project");
  const [yAxisVar, setYAxisVar] = useState<AxisVariable>("share_funding");

  const { data, isLoading } = useQuery({
    queryKey: ["efficiencyScatter", params],
    queryFn: () => getData(params),
  });

  // Nettoyer l'intervalle au démontage
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Fonction pour avancer au framework suivant
  const nextFramework = useCallback(() => {
    setCurrentFrameworkIndex((prev) => {
      const next = prev + 1;
      if (next >= FRAMEWORKS_ORDER.length) {
        // Animation terminée, arrêter et revenir au premier framework
        setIsPlaying(false);
        return 0;
      }
      return next;
    });
  }, []);

  // Gérer le play/pause
  useEffect(() => {
    if (isPlaying) {
      // Commencer l'animation
      intervalRef.current = setInterval(nextFramework, 2500);
    } else {
      // Arrêter l'animation
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, nextFramework]);

  const handlePlay = () => {
    setCurrentFrameworkIndex(0);
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentFrameworkIndex(0);
  };

  // Sélection manuelle d'un framework
  const handleSelectFramework = (index: number) => {
    setIsPlaying(false);
    setCurrentFrameworkIndex(index);
  };

  if (isLoading || !data) return <DefaultSkeleton />;

  const currentFramework = FRAMEWORKS_ORDER[currentFrameworkIndex];
  const chartId = "efficiencyScatter";
  const config = {
    id: chartId,
    comment: {
      fr: <>{i18n.comment.fr}</>,
      en: <>{i18n.comment.en}</>,
    },
    readingKey: readingKey(data, isLoading),
    sources: EPChartsSources,
    integrationURL: `/integration?chart_id=${chartId}&${params}`,
  };

  return (
    <div className={`chart-container chart-container--${color}`}>
      <span className="chart-badge">Top 15</span>
      <Row className="fr-mt-2w fr-ml-1w">
        <Col>
          <Title as="h3" look="h6" className="fr-mb-1w">
            {i18n.title.fr}
          </Title>
        </Col>
        <Col>
          {/* Contrôles d'animation */}
          <div className="efficiency-scatter__controls fr-mb-2w">
            <div className="efficiency-scatter__buttons">
              {!isPlaying ? (
                <Button onClick={handlePlay} size="sm" variant="secondary" icon="play-fill" title={currentLang === "fr" ? "Lancer l'animation" : "Play animation"}>
                  {currentLang === "fr" ? "Lecture" : "Play"}
                </Button>
              ) : (
                <Button onClick={handlePause} size="sm" variant="secondary" icon="pause-fill" title={currentLang === "fr" ? "Pause" : "Pause"}>
                  {currentLang === "fr" ? "Pause" : "Pause"}
                </Button>
              )}
              <Button onClick={handleReset} size="sm" variant="tertiary" icon="refresh-line" title={currentLang === "fr" ? "Revenir au début" : "Back to start"} disabled={currentFrameworkIndex === 0 && !isPlaying}>
                {currentLang === "fr" ? "Début" : "Start"}
              </Button>
            </div>

            {/* Indicateurs de framework */}
            <div>
              {FRAMEWORKS_ORDER.map((fw, index) => (
                <button key={fw} onClick={() => handleSelectFramework(index)} className={`efficiency-scatter__framework-btn ${currentFrameworkIndex === index ? "efficiency-scatter__framework-btn--active" : ""}`} title={FRAMEWORK_LABELS[fw]}>
                  {fw === "HORIZON EUROPE" ? "HE" : fw}
                </button>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      {/* Sélecteurs d'axes */}
      <Row className="fr-px-1w" gutters>
        <Col>
          <label htmlFor="x-axis-selector">{getI18nLabel(i18n, "x-axis-selector", currentLang)}</label>
          <select id="x-axis-selector" value={xAxisVar} onChange={(e) => setXAxisVar(e.target.value as AxisVariable)} className="fr-select efficiency-scatter__select">
            {AXIS_VARIABLES.map((varKey) => (
              <option key={varKey} value={varKey}>
                {getI18nLabel(i18n, VARIABLE_CONFIG[varKey].i18nKey, currentLang)}
              </option>
            ))}
          </select>
        </Col>
        <Col>
          <label htmlFor="y-axis-selector">{getI18nLabel(i18n, "y-axis-selector", currentLang)}</label>
          <select id="y-axis-selector" value={yAxisVar} onChange={(e) => setYAxisVar(e.target.value as AxisVariable)} className="fr-select efficiency-scatter__select">
            {AXIS_VARIABLES.map((varKey) => (
              <option key={varKey} value={varKey}>
                {getI18nLabel(i18n, VARIABLE_CONFIG[varKey].i18nKey, currentLang)}
              </option>
            ))}
          </select>
        </Col>
      </Row>

      <ChartWrapper config={config} options={options(data, currentLang, currentFramework, xAxisVar, yAxisVar)} renderData={() => renderDataTable(data, currentLang)} />
    </div>
  );
}
