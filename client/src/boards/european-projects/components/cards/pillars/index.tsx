import { Badge } from "@dataesr/dsfr-plus";
import { Link } from "react-router-dom";

function matchPiliarId(idFromDb) {
  switch (idFromDb) {
    case "HORIZON.1":
      return "PILAR 1";
    case "HORIZON.2":
      return "PILAR 2";
    case "HORIZON.3":
      return "PILAR 3";
    case "HORIZON.4":
      return "PILAR 4";
    default:
      return idFromDb;
  }
}

export default function PillarCard({ title, subtitle, description, to, titleAs: Heading = "h3" }: { title: string; subtitle?: string; description?: string; to: string; titleAs?: "h2" | "h3" | "h4" | "h5" }) {
  return (
    <div className="fr-card fr-enlarge-link" style={{ borderBottom: "4px solid #a00351ff" }}>
      <div className="fr-card__body">
        <div className="fr-card__content">
          <Heading className="fr-card__title">
            <Link to={to}>{title}</Link>
          </Heading>
          {subtitle && (
            <Badge className="fr-mb-2w" color="purple-glycine">
              {matchPiliarId(subtitle)}
            </Badge>
          )}
          {description && <p className="fr-card__desc">{description}</p>}
        </div>
      </div>
    </div>
  );
}
