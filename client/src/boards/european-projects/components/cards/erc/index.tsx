import { Badge } from "@dataesr/dsfr-plus";
import { Link } from "react-router-dom";

export { default as ErcSynthesisCards } from "./synthesis-cards";
export { default as ErcDestinationCards } from "./destination-cards";
export { default as ErcPanelCards } from "./panel-cards";

export default function ErcCard({ title, subtitle, description, to, titleAs: Heading = "h3" }: { title: string; subtitle?: string; description?: string; to: string; titleAs?: "h2" | "h3" | "h4" | "h5" }) {
  return (
    <div className="fr-card fr-enlarge-link" style={{ borderBottom: "4px solid var(--text-label-orange-terre-battue)" }}>
      <div className="fr-card__body">
        <div className="fr-card__content">
          <Heading className="fr-card__title">
            <Link to={to}>{title}</Link>
          </Heading>
          {subtitle && (
            <Badge className="fr-mb-2w" color="orange-terre-battue">
              {subtitle}
            </Badge>
          )}
          {description && <p className="fr-card__desc">{description}</p>}
        </div>
      </div>
    </div>
  );
}
