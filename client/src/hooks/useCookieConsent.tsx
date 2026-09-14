import Cookies from "js-cookie"
import { useState } from "react"

import { COOKIE_CONSENT_NAME, COOKIE_CONSENT_VERSION } from "../utils/cookieUtils"

export interface CookieCategories {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
}

export interface CookieConsentHook {
  consent: CookieCategories;
  hasConsented: boolean;
  showBanner: boolean;
  acceptAll: () => void;
  refuseAll: () => void;
  savePreferences: (preferences: CookieCategories) => void;
  resetConsent: () => void;
}

const defaultConsent: CookieCategories = {
  necessary: true, // Les cookies nécessaires sont toujours acceptés
  functional: false,
  analytics: false,
};

export function useCookieConsent(): CookieConsentHook {
  const [state, setState] = useState(() => {
    // Initialisation synchrone pour éviter les problèmes de re-rendu
    const savedConsent = Cookies.get(COOKIE_CONSENT_NAME);

    if (savedConsent) {
      try {
        const parsedConsent = JSON.parse(savedConsent);
        if (parsedConsent.version === COOKIE_CONSENT_VERSION) {
          return {
            consent: parsedConsent.preferences,
            hasConsented: true,
            showBanner: false,
          };
        }
      } catch (error) {
        console.error("Erreur lors du parsing du consentement cookie:", error);
      }
    }

    return {
      consent: defaultConsent,
      hasConsented: false,
      showBanner: true,
    };
  });

  const saveConsentToCookie = (preferences: CookieCategories) => {
    const consentData = {
      version: COOKIE_CONSENT_VERSION,
      preferences,
      timestamp: new Date().toISOString(),
    };

    // Sauvegarder le consentement pour 1 an
    Cookies.set(COOKIE_CONSENT_NAME, JSON.stringify(consentData), {
      expires: 365,
      sameSite: "Lax",
      secure: window.location.protocol === "https:",
    });

    setState({
      consent: preferences,
      hasConsented: true,
      showBanner: false,
    });

    // Nettoyer les cookies non autorisés
    cleanupCookies(preferences);
  };

  const cleanupCookies = (preferences: CookieCategories) => {
    // Si les cookies fonctionnels ne sont pas autorisés, supprimer les cookies de filtres
    if (!preferences.functional) {
      // Supprimer tous les cookies de filtres des projets européens
      const functionalCookies = ["selectedPillars", "selectedPrograms", "selectedThematics", "selectedDestinations"];

      functionalCookies.forEach((cookieName) => {
        Cookies.remove(cookieName);
      });
    }

    // Si les cookies analytics ne sont pas autorisés, supprimer les cookies analytics
    if (!preferences.analytics) {
      // Ici on peut ajouter la suppression des cookies analytics quand ils seront implémentés
      // Par exemple: Google Analytics, Matomo, etc.
    }
  };

  const acceptAll = () => {
    const allAccepted: CookieCategories = {
      necessary: true,
      functional: true,
      analytics: true,
    };

    saveConsentToCookie(allAccepted);
  };

  const refuseAll = () => {
    const onlyNecessary: CookieCategories = {
      necessary: true,
      functional: false,
      analytics: false,
    };
    saveConsentToCookie(onlyNecessary);
  };

  const savePreferences = (preferences: CookieCategories) => {
    // Les cookies nécessaires sont toujours acceptés
    const finalPreferences = {
      ...preferences,
      necessary: true,
    };
    saveConsentToCookie(finalPreferences);
  };

  const resetConsent = () => {
    Cookies.remove(COOKIE_CONSENT_NAME);
    setState({
      consent: defaultConsent,
      hasConsented: false,
      showBanner: true,
    });
  };

  return {
    consent: state.consent,
    hasConsented: state.hasConsented,
    showBanner: state.showBanner,
    acceptAll,
    refuseAll,
    savePreferences,
    resetConsent,
  };
}
