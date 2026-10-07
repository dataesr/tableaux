import { Link, Text, Title } from "@dataesr/dsfr-plus";

import "./styles.scss";

interface StructureCardProps {
  description?: string;
  subtitle?: string;
  title: string;
  type: string;
  value: any;
}


export default function CardSimple({
  description,
  subtitle,
  title,
  type,
  value,
}: StructureCardProps) {
  return (
    <div
      className="structure-card fr-card fr-enlarge-link fr-p-3w"
      role="button"
      tabIndex={0}
    >
      <Title as="h2" className="structure-card__title fr-card_title" look="h5">
        <Link href={`?${type}=${value}`}>
          {title}
        </Link>
      </Title>
      {subtitle && <Text className="structure-card__meta">{subtitle}</Text>}
      {description && (
        <Text className="structure-card__meta">{description}</Text>
      )}
    </div>
  );
}
