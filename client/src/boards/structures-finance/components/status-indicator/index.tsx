import { useFinanceDefinitions } from "../../api";

interface StatusIndicatorProps {
  status: "alerte" | "vigilance" | "normal";
  className?: string;
  indicateur?: string;
}

const STATUS_CONFIG = {
  alerte: {
    badge: "fr-badge--error",
    label: "Alerte",
  },
  vigilance: {
    badge: "fr-badge--warning",
    label: "Vigilance",
  },
  normal: {
    badge: "fr-badge--success",
    label: "Normal",
  },
};

const MAX_CHARS = 200;

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
};

export default function StatusIndicator({
  status,
  className = "",
  indicateur,
}: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.normal;
  const { data: definitions } = useFinanceDefinitions();
  const tooltipId = `tooltip-status-${indicateur}-${status}`;

  let interpretation: string | null = null;
  if (definitions && indicateur) {
    for (const category of definitions) {
      for (const subCategory of category.sousRubriques) {
        const def = subCategory.definitions.find(
          (d) => d.indicateur === indicateur
        );
        if (def?.interpretation) {
          interpretation = def.interpretation;
          break;
        }
      }
      if (interpretation) break;
    }
  }

  return (
    <>
      <span className={`fr-badge fr-badge--sm ${config.badge} fr-ml-1w ${className}`}>
        {config.label}
      </span>
      {interpretation && (
        <>
          <button
            type="button"
            className="fr-btn--tooltip fr-btn"
            aria-describedby={tooltipId}
          >
            Interprétation de l'indicateur
          </button>
          <span
            className="fr-tooltip fr-placement"
            id={tooltipId}
            role="tooltip"
            aria-hidden="true"
          >
            {truncateText(interpretation, MAX_CHARS)}
          </span>
        </>
      )}
    </>
  );
}
