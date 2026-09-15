import { Title, Text } from "@dataesr/dsfr-plus";
import SectionYearSelect from "../../../../../../../components/section-year-select";

interface PositionningSectionWrapperProps {
  children: React.ReactNode;
  structureName: string;
}

export function PositionningSectionWrapper({
  children,
  structureName,
}: PositionningSectionWrapperProps) {
  return (
    <section
      id="section-positionnement"
      aria-labelledby="section-positionnement-title"
      className="section-container"
    >
      <div className="section-header section-header--year fr-mb-4w">
        <div className="section-header__title">
          <Title
            as="h2"
            look="h5"
            id="section-positionnement-title"
            className="fr-mb-1w"
          >
            Positionnement de {structureName}
          </Title>
          <Text className="fr-text--sm fr-text-mention--grey fr-mb-0">
            Comparez {structureName} avec d'autres établissements.
          </Text>
        </div>
        <SectionYearSelect />
      </div>
      {children}
    </section>
  );
}
