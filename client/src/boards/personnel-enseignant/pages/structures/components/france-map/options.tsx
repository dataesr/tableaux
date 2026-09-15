import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import mapDataIE from "../../../../../../assets/regions.json";
import { getCssColor } from "../../../../../../utils/colors";

interface MapOptionsParams {
    chartData: Array<{
        "hc-key": string;
        name: string;
        value: number;
        male_count: number;
        female_count: number;
        male_percent: number;
        female_percent: number;
    }>;
    maxValue: number;
    clickable?: boolean;
}

function niceCeil(value: number): number {
    if (value <= 0) return 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const normalized = value / magnitude;
    const nice =
        normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
    return nice * magnitude;
}

const fmt = (n?: number) => (n ?? 0).toLocaleString("fr-FR");

export function createFranceMapOptions({
    chartData,
    maxValue,
    clickable = false,
}: MapOptionsParams): Highcharts.Options {
    const femmesColor = getCssColor("fm-femmes");
    const hommesColor = getCssColor("fm-hommes");

    const scale = [
        getCssColor("blue-france-925-125"),
        getCssColor("blue-france-850-200"),
        getCssColor("blue-france-main-525"),
        getCssColor("blue-france-sun-113-625"),
    ];

    const bgColor = getCssColor("background-default-grey");
    const textColor = getCssColor("text-default-grey");
    const textStrong = getCssColor("text-title-grey");
    const borderColor = getCssColor("border-default-grey");
    const nullColor = getCssColor("background-contrast-grey");

    const step = niceCeil(maxValue / scale.length);
    const dataClasses = scale.map((color, i) => {
        const from = i * step;
        const to = (i + 1) * step;
        const isLast = i === scale.length - 1;
        return {
            color,
            from,
            ...(isLast ? {} : { to }),
            name: isLast
                ? `${fmt(from)} et plus`
                : `${fmt(from)} – ${fmt(to)}`,
        };
    });

    return {
        chart: {
            map: mapDataIE as any,
            backgroundColor: "transparent",
            height: "500px",
            spacing: [8, 0, 8, 0],
            style: { fontFamily: "Marianne, sans-serif" },
        },
        title: { text: "" },
        exporting: { enabled: false },
        credits: { enabled: false },
        accessibility: {
            enabled: true,
            description:
                "Carte choroplèthe des effectifs enseignants par région du siège de l'établissement. Les régions les plus foncées comptent le plus d'enseignants.",
            keyboardNavigation: { enabled: true },
            point: {
                valueDescriptionFormat:
                    "{point.name} : {point.value} enseignants.",
            },
        },
        mapNavigation: {
            enabled: true,
            enableMouseWheelZoom: false,
            buttonOptions: { align: "left", verticalAlign: "top" },
        },
        colorAxis: {
            dataClasses,
            dataClassColor: "category",
        },
        legend: {
            layout: "horizontal",
            align: "center",
            verticalAlign: "bottom",
            itemStyle: { fontSize: "12px", color: textColor, fontWeight: "normal" },
            title: {
                text: "Nombre d'enseignants",
                style: { fontSize: "12px", color: textColor, fontWeight: "bold" },
            },
        },
        tooltip: {
            useHTML: true,
            headerFormat: "",
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderRadius: 6,
            shadow: false,
            style: { color: textColor },
            pointFormatter: function () {
                const point = this as any;
                const dot = (color: string) =>
                    `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle;"></span>`;
                return `
          <div style="padding:8px 12px; min-width:200px; font-family:Marianne, sans-serif;">
            <strong style="font-size:13px; color:${textStrong};">${point.name}</strong>
            <div style="margin-top:6px; font-size:12px; color:${textColor};">Total : <strong>${fmt(point.options.value)}</strong> enseignants</div>
            <div style="margin-top:4px; font-size:12px; color:${textColor};">${dot(femmesColor)}Femmes : <strong>${fmt(point.options.female_count)}</strong> (${point.options.female_percent} %)</div>
            <div style="margin-top:2px; font-size:12px; color:${textColor};">${dot(hommesColor)}Hommes : <strong>${fmt(point.options.male_count)}</strong> (${point.options.male_percent} %)</div>
          </div>`;
            },
        },
        plotOptions: {
            series: {
                cursor: clickable ? "pointer" : "default",
            },
        },
        series: [
            {
                type: "map",
                data: chartData,
                joinBy: "hc-key",
                name: "Enseignants",
                allAreas: true,
                nullColor,
                borderColor: borderColor,
                borderWidth: 0.8,
                states: {
                    hover: {
                        borderColor: textStrong,
                        borderWidth: 1.5,
                        brightness: 0.06,
                    },
                },
                dataLabels: { enabled: false },
            },
        ] as any,
    };
}
