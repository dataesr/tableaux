interface IncompleteYearWarningProps {
    selectedYear: string;
    latestCompleteYear: string;
}

export function IncompleteYearWarning({ selectedYear, latestCompleteYear }: IncompleteYearWarningProps) {
    if (!selectedYear || !latestCompleteYear || selectedYear <= latestCompleteYear) return null;

    return (
        <div className="fr-alert fr-alert--info fr-mb-2w">
            <p className="fr-alert__title">Données incomplètes</p>
            <p>
                Les données pour l'année universitaire <strong>{selectedYear}</strong> sont incomplètes : certaines enquêtes ne sont pas encore disponibles pour cette année.
            </p>
        </div>
    );
}
