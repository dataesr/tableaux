import { useId } from "react";

export const TrendIndicator = ({ trend }: { trend: number }) => {
    const tooltipId = useId();

    if (trend === 0) {
        return (
            <span className="fr-tooltip__container">
                <span
                    aria-describedby={tooltipId}
                    style={{ color: "grey", marginLeft: 4, cursor: "help" }}
                >
                    ●
                </span>
                <span
                    className="fr-tooltip fr-placement"
                    id={tooltipId}
                    role="tooltip"
                    aria-hidden="true"
                >
                    Tendance: Stable
                </span>
            </span>
        );
    }

    const isUp = trend > 0;
    const color = isUp
        ? "var(--green-bourgeon-850)"
        : "var(--red-marianne-main-472)";
    const icon = isUp ? "▲" : "▼";

    return (
        <span className="fr-tooltip__container">
            <span
                aria-describedby={tooltipId}
                style={{ color, marginLeft: 4, cursor: "help" }}
            >
                {icon}
            </span>
            <span
                className="fr-tooltip fr-placement"
                id={tooltipId}
                role="tooltip"
                aria-hidden="true"
            >
                Tendance: {isUp ? "En hausse" : "En baisse"} de{" "}
                {Math.abs(trend).toLocaleString()} par rapport à l'année universitaire
                précédente
            </span>
        </span>
    );
};
