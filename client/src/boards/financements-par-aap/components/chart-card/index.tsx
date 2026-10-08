import { useEffect, useId, useRef } from "react";
import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { Title } from "@dataesr/dsfr-plus";

interface ChartCardProps {
  color?: string;
  data?: Array<{ x: number; y: number }>;
  detail?: string;
  title: string;
  titleAs?: "h2" | "h3" | "h4" | "h5" | "h6";
  tooltipFormatter?: Highcharts.TooltipFormatterCallbackFunction | undefined;
  unit?: string;
  value: string;
  yAxisMax?: number;
}

export default function ChartCard({
  color = "var(--blue-france-sun-113)",
  data,
  detail,
  title,
  titleAs = "h2",
  tooltipFormatter = function (this: any) { return `<b>${this.x}</b><br/>${this.y}` },
  unit = "",
  value,
  yAxisMax = undefined,
}: ChartCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<Highcharts.Chart | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0)
      return;

    const categories = data.sort((a, b) => a.x - b.x).map((item) => String(item.x));
    const dataSeries = data.sort((a, b) => a.x - b.x).map((item) => item.y);

    const resolvedColor = color.startsWith("var(")
      ? getComputedStyle(document.documentElement)
        .getPropertyValue(color.slice(4, -1))
        .trim()
      : color;

    chartInstance.current = Highcharts.chart({
      accessibility: {
        enabled: false,
      },
      chart: {
        backgroundColor: 'transparent',
        height: 110,
        margin: [0, 0, 0, 0],
        renderTo: chartRef.current,
        spacing: [0, 0, 0, 0],
        type: 'areaspline',
      },
      title: { text: '' },
      subtitle: { text: '' },
      credits: { enabled: false },
      xAxis: {
        categories,
        labels: { enabled: false },
        lineWidth: 0,
        tickLength: 0,
        title: { text: '' },
        visible: false,
      },
      yAxis: {
        gridLineWidth: 0,
        labels: { enabled: false },
        max: yAxisMax,
        min: 1,
        title: { text: '' },
        visible: false,
      },
      legend: {
        enabled: false,
      },
      plotOptions: {
        areaspline: {
          enableMouseTracking: true,
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [
                0,
                Highcharts.color(resolvedColor)
                  .setOpacity(0.8)
                  .get("rgba") as string,
              ],
              [
                0.4,
                Highcharts.color(resolvedColor)
                  .setOpacity(0.15)
                  .get("rgba") as string,
              ],
              [
                1,
                Highcharts.color(resolvedColor)
                  .setOpacity(0.02)
                  .get("rgba") as string,
              ],
            ],
          },
          lineColor: resolvedColor,
          lineWidth: 3,
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: true,
                fillColor: resolvedColor,
                lineColor: "#fff",
                lineWidth: 2,
                radius: 4,
              },
            },
          },
          states: { hover: { lineWidth: 3 } },
          threshold: null,
        },
      },
      exporting: { enabled: false },
      tooltip: {
        backgroundColor: "var(--background-contrast-grey)",
        borderColor: "var(--border-default-grey)",
        formatter: tooltipFormatter,
        shared: true,
        style: { color: "var(--text-default-grey)" },
      },
      series: [
        {
          data: dataSeries,
          name: title,
          type: "areaspline",
        },
      ],
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [color, data, title, unit]);

  return (
    <div
      className="fr-card"
      role="group"
      aria-labelledby={titleId}
      style={{
        borderBottom: "none",
        borderLeft: "none",
        borderRight: "none",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {data && data.length > 0 && (
        <div
          aria-hidden="true"
          ref={chartRef}
          style={{
            bottom: "20px",
            height: "110px",
            left: 0,
            position: "absolute",
            right: 0,
            width: "100%",
            zIndex: 1,
          }}
        />
      )}

      <div
        className="fr-card__body fr-p-2w"
        style={{ position: "relative", pointerEvents: "none" }}
      >
        <div className="fr-card__content">
          <Title
            as={titleAs}
            className="fr-text--sm fr-text--bold fr-mb-1v"
            id={titleId}
            style={{
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {title}
          </Title>
          <p className="fr-h5 fr-mb-1v">{value}</p>
          {detail && (
            <p
              className="fr-text--sm"
              style={{
                margin: 0,
                position: "relative",
              }}
            >
              {detail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
