import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import HighchartsReact from "highcharts-react-official";
import { getCssColor } from "../../../utils/colors";

type TrendGraphProps = {
  data: number[];
  color?: string;
};

export default function TrendGraph({ data = [], color = "atlas-primary-color" }: TrendGraphProps) {
  const options = {
    chart: {
      backgroundColor: "transparent",
      type: "spline",
      height: "90px",
    },
    credits: { enabled: false },
    legend: { enabled: false },
    exporting: { enabled: false },
    title: { text: "" },
    yAxis: { visible: false },
    xAxis: { visible: false },
    plotOptions: {
      spline: {
        lineWidth: 4,
        states: {
          hover: {
            lineWidth: 5,
          },
        },
        marker: {
          enabled: false,
        },
      },
      series: {
        label: {
          connectorAllowed: false,
        },
        pointStart: 2001,
      },
    },
    tooltip: {
      formatter: function () {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return `Année universitaire <b>${this.x}-${parseInt(this.x.toString().substring(2)) + 1}</b><br/>=> <b>${this.y.toLocaleString("fr-FR")}</b> étudiants`;
      },
    },
    colors: [getCssColor(color)],
    series: [
      {
        name: "Effectif étudiants",
        data,
      },
    ],
  };

  return (
    <div className="highcharts-container">
      <figure className="highcharts-figure">
        <HighchartsReact highcharts={Highcharts} options={options} />
      </figure>
    </div>
  );
}
