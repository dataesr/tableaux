import { useState, useEffect } from "react";
import { getConsentedCookie, setConsentedCookie, hasConsentFor } from "../utils/cookies";

/**
 * Hook personnalisé pour gérer les filtres avec vérification du consentement aux cookies
 */
export function useConsentedFilter(filterName: string, defaultValue: string[] = []) {
  const [filterValue, setFilterValue] = useState<string[]>(defaultValue);

  // Charger la valeur depuis les cookies au montage du composant
  useEffect(() => {
    if (hasConsentFor("functional")) {
      const savedValue = getConsentedCookie(filterName, "functional");
      if (savedValue) {
        try {
          const parsedValue = JSON.parse(savedValue);
          setFilterValue(Array.isArray(parsedValue) ? parsedValue : defaultValue);
        } catch (error) {
          console.warn(`Erreur lors du parsing du filtre ${filterName}:`, error);
          setFilterValue(defaultValue);
        }
      }
    }
  }, [filterName, defaultValue]);

  // Fonction pour mettre à jour le filtre
  const updateFilter = (newValue: string[]) => {
    setFilterValue(newValue);

    // Sauvegarder dans les cookies seulement si le consentement est donné
    if (hasConsentFor("functional")) {
      setConsentedCookie(filterName, JSON.stringify(newValue), { expires: 30, sameSite: "Lax" }, "functional");
    }
  };

  // Fonction pour réinitialiser le filtre
  const resetFilter = () => {
    setFilterValue(defaultValue);
    if (hasConsentFor("functional")) {
      setConsentedCookie(filterName, JSON.stringify(defaultValue), { expires: 30, sameSite: "Lax" }, "functional");
    }
  };

  return {
    value: filterValue,
    setValue: updateFilter,
    reset: resetFilter,
    canPersist: hasConsentFor("functional"),
  };
}
