import { Accordion, AccordionGroup, Badge } from "@dataesr/dsfr-plus";
import { useMemo } from "react";
import { formatToPercent } from "../../../../../../../utils/format";
import { TrendIndicator } from "./tendances";
import "./styles.scss";

interface AgeDistItem {
    ageClass: string;
    count: number;
    percent: number;
}

interface CategoryItem {
    categoryName: string;
    count: number;
}

interface CnuSection {
    cnuSectionId: string;
    cnuSectionLabel: string;
    maleCount: number;
    femaleCount: number;
    totalCount: number;
    ageDistribution: AgeDistItem[];
    categories: CategoryItem[];
}

interface CnuGroup {
    cnuGroupId: string;
    cnuGroupLabel: string;
    cnuSections: CnuSection[];
    [key: string]: any;
}

interface CnuSectionsTableProps {
    cnuGroups: CnuGroup[];
    previousCnuGroups?: CnuGroup[];
    showAgeDemographics?: boolean;
}

export default function CnuSectionsTable({
    cnuGroups,
    previousCnuGroups,
    showAgeDemographics = true,
}: CnuSectionsTableProps) {
    const cnuSections = useMemo(() => {
        if (!cnuGroups) return [];
        return cnuGroups.flatMap((group) =>
            (group.cnuSections || []).map((section) => ({
                ...section,
                cnuGroupId: group.cnuGroupId,
                cnuGroupLabel: group.cnuGroupLabel,
            }))
        );
    }, [cnuGroups]);

    const allCategories = useMemo(() => {
        const uniqueCategories = Array.from(
            new Set(
                cnuSections.flatMap((section) =>
                    (section.categories || []).map((cat) => cat.categoryName)
                )
            )
        ).filter(Boolean);

        const desiredOrder = [
            "Maître de conférences et assimilés",
            "Professeur et assimilés",
            "enseignants du 2nd degré",
        ];

        uniqueCategories.sort((a, b) => {
            const indexA = desiredOrder.indexOf(String(a));
            const indexB = desiredOrder.indexOf(String(b));
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return String(a).localeCompare(String(b));
        });

        return uniqueCategories;
    }, [cnuSections]);

    const processedCnuSections = useMemo(() => {
        if (!cnuSections.length) return [];
        const prevSectionsFlat =
            (previousCnuGroups || []).flatMap((group) => group.cnuSections || []);
        const prevSectionsMap = new Map(
            prevSectionsFlat.map((s) => [s.cnuSectionId, s])
        );

        return cnuSections.map((section) => {
            const prevSection = prevSectionsMap.get(section.cnuSectionId);
            const categoriesWithTrend = allCategories.map((cat) => {
                const currentCat = section.categories?.find((c) => c.categoryName === cat);
                const prevCat = prevSection?.categories?.find((c) => c.categoryName === cat);
                const currentCount = currentCat?.count || 0;
                const prevCount = prevCat?.count || 0;
                return { name: cat, count: currentCount, trend: currentCount - prevCount };
            });
            return { ...section, categoriesWithTrend };
        });
    }, [cnuSections, previousCnuGroups, allCategories]);

    if (cnuSections.length === 0) {
        return (
            <div className="fr-alert fr-alert--info">
                <p>Aucune section CNU disponible pour ce contexte.</p>
            </div>
        );
    }

    type ProcessedSection = (typeof processedCnuSections)[number];
    const groupedByGroup: Record<string, ProcessedSection[]> = {};
    processedCnuSections.forEach((section) => {
        const key = `${section.cnuGroupId} - ${section.cnuGroupLabel}`;
        if (!groupedByGroup[key]) groupedByGroup[key] = [];
        groupedByGroup[key].push(section);
    });

    return (
        <div className="cnu-table-root">
            <AccordionGroup>
                {Object.entries(groupedByGroup).map(([groupKey, sections]) => (
                    <Accordion key={groupKey} title={groupKey} titleAs="h4" defaultExpanded={false}>
                        <div className="cnu-table-scroll cnu-table-scroll--sm">
                            <table className="fr-table fr-table--bordered fr-table--no-caption cnu-table">
                                <thead className="cnu-table__head">
                                    <tr>
                                        <th scope="col" className="th--label">Section CNU</th>
                                        <th scope="col" className="text-center th--min60">Hommes</th>
                                        <th scope="col" className="text-center th--min60">Femmes</th>
                                        <th scope="col" className="text-center th--min60">Total</th>
                                        <th scope="col" className="text-center th--min140">Répartition H/F</th>
                                        {showAgeDemographics && (
                                            <th scope="col" className="text-center th--min140">
                                                Répartition par âge
                                                <div className="age-legend">
                                                    <span title="≤ 35 ans"><span className="legend-color age-35" /> ≤35</span>
                                                    <span title="36-55 ans"><span className="legend-color age-36-55" /> 36-55</span>
                                                    <span title="≥ 56 ans"><span className="legend-color age-56" /> ≥56</span>
                                                    <span title="Non précisé"><span className="legend-color age-np" /> NP</span>
                                                </div>
                                            </th>
                                        )}
                                        {allCategories.map((cat) => (
                                            <th key={String(cat)} scope="col" className="text-center th--min80">
                                                {String(cat)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sections.map((section) => {
                                        const malePercent =
                                            section.totalCount > 0
                                                ? Math.round((section.maleCount / section.totalCount) * 100)
                                                : 0;
                                        const femalePercent = 100 - malePercent;

                                        const younger35 = section.ageDistribution?.find((a) => a.ageClass === "35 ans et moins");
                                        const middle = section.ageDistribution?.find((a) => a.ageClass === "36 à 55 ans");
                                        const older56 = section.ageDistribution?.find((a) => a.ageClass === "56 ans et plus");
                                        const unspecified = section.ageDistribution?.find((a) => a.ageClass === "Non précisé");

                                        const totalForAge =
                                            (younger35?.count || 0) + (middle?.count || 0) + (older56?.count || 0) + (unspecified?.count || 0) || 1;
                                        const p35 = Math.round(((younger35?.count || 0) / totalForAge) * 100);
                                        const p36_55 = Math.round(((middle?.count || 0) / totalForAge) * 100);
                                        const p56 = Math.round(((older56?.count || 0) / totalForAge) * 100);
                                        const pUnspecified = Math.max(0, 100 - (p35 + p36_55 + p56));

                                        return (
                                            <tr key={section.cnuSectionId}>
                                                <td>
                                                    <strong>{section.cnuSectionLabel} - {section.cnuSectionId}</strong>
                                                </td>
                                                <td className="text-center">{section.maleCount.toLocaleString()}</td>
                                                <td className="text-center">{section.femaleCount.toLocaleString()}</td>
                                                <td className="text-center">{section.totalCount?.toLocaleString()}</td>
                                                <td className="text-center nowrap">
                                                    <div className="progress-container">
                                                        <div className="progress-bar male" style={{ width: `${malePercent}%` }} />
                                                        <div className="progress-bar female" style={{ width: `${femalePercent}%` }} />
                                                    </div>
                                                    <Badge>
                                                        {formatToPercent(malePercent)} / {formatToPercent(femalePercent)}
                                                    </Badge>
                                                </td>
                                                {showAgeDemographics && (
                                                    <td className="text-center">
                                                        <div className="age-bars" aria-label="Répartition par âge">
                                                            <span className="age-segment age-35" title={`≤ 35 ans: ${younger35?.count.toLocaleString() || 0}`} style={{ width: `${p35}%` }} />
                                                            <span className="age-segment age-36-55" title={`36-55 ans: ${middle?.count.toLocaleString() || 0}`} style={{ width: `${p36_55}%` }} />
                                                            <span className="age-segment age-56" title={`≥ 56 ans: ${older56?.count.toLocaleString() || 0}`} style={{ width: `${p56}%` }} />
                                                            {pUnspecified > 0 && (
                                                                <span className="age-segment age-np" title={`Non précisé: ${unspecified?.count.toLocaleString() || 0}`} style={{ width: `${pUnspecified}%` }} />
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                                {section.categoriesWithTrend.map((cat) => (
                                                    <td key={String(cat.name)} className="text-center">
                                                        {cat.count.toLocaleString()}
                                                        {previousCnuGroups && <TrendIndicator trend={cat.trend} />}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Accordion>
                ))}
            </AccordionGroup>
        </div>
    );
}
