import { useSearchParams } from "react-router-dom";
import { hasConsentFor } from "../../../utils/cookies";
import { useCookieConsent } from "../../../hooks/useCookieConsent";

interface CookieStatusInfoProps {
  className?: string;
}

export default function CookieStatusInfo({ className = "" }: CookieStatusInfoProps) {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const { hasConsented } = useCookieConsent();
  const canSaveFilters = hasConsentFor("functional");

  const messages = {
    fr: {
      filtersNotSaved: "⚠️ Vos filtres ne sont pas sauvegardés (cookies fonctionnels désactivés)",
      filtersSaved: "✅ Vos filtres sont automatiquement sauvegardés",
      noConsent: "ℹ️ Vous n'avez pas encore configuré vos préférences de cookies",
    },
    en: {
      filtersNotSaved: "⚠️ Your filters are not saved (functional cookies disabled)",
      filtersSaved: "✅ Your filters are automatically saved",
      noConsent: "ℹ️ You haven't configured your cookie preferences yet",
    },
  };

  const currentMessages = messages[currentLang as keyof typeof messages] || messages.fr;

  let message: string;
  let alertType: string;

  if (!hasConsented) {
    message = currentMessages.noConsent;
    alertType = "fr-alert--info";
  } else if (canSaveFilters) {
    message = currentMessages.filtersSaved;
    alertType = "fr-alert--success";
  } else {
    message = currentMessages.filtersNotSaved;
    alertType = "fr-alert--warning";
  }

  return (
    <div className={`fr-alert ${alertType} fr-alert--sm ${className}`}>
      <p className="fr-alert__title">{message}</p>
    </div>
  );
}
