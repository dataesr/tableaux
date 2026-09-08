import { Badge } from "@dataesr/dsfr-plus";
import { Link } from "react-router-dom";

export { default as MscaSynthesisCards } from "./synthesis-cards";
export { default as MscaDestinationCards } from "./destination-cards";
export { default as MscaPanelCards } from "./panel-cards";

export default function MscaCard({ title, subtitle, description, to, titleAs: Heading = "h3" }: { title: string; subtitle?: string; description?: string; to: string; titleAs?: "h2" | "h3" | "h4" | "h5" }) {
  return (
    <div className="fr-card fr-enlarge-link" style={{ borderBottom: "4px solid var(--text-label-green-menthe)" }}>
      <div className="fr-card__body">
        <div className="fr-card__content">
          <Heading className="fr-card__title">
            <Link to={to}>{title}</Link>
          </Heading>
          {subtitle && (
            <Badge className="fr-mb-2w" color="green-menthe">
              {subtitle}
            </Badge>
          )}
          {description && <p className="fr-card__desc">{description}</p>}
        </div>
      </div>
    </div>
  );
}
