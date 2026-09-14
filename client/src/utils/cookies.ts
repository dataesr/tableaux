import Cookies from "js-cookie"

export const COOKIE_CONSENT_NAME = "tableaux-cookie-consent";
export const COOKIE_CONSENT_VERSION = "1.0";

interface ConsentData {
  version: string;
  preferences: {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
  };
  timestamp: string;
}

/**
 * Vérifie si l'utilisateur a consenti à une catégorie de cookies
 */
export function hasConsentFor(category: 'necessary' | 'functional' | 'analytics'): boolean {
  try {
    const consentCookie = Cookies.get(COOKIE_CONSENT_NAME);
    if (!consentCookie) {
      // Si pas de consentement, seuls les cookies nécessaires sont autorisés
      return category === 'necessary';
    }

    const consentData: ConsentData = JSON.parse(consentCookie);
    return consentData.preferences[category];
  } catch (error) {
    console.error('Erreur lors de la vérification du consentement:', error);
    // En cas d'erreur, seuls les cookies nécessaires sont autorisés
    return category === 'necessary';
  }
}

/**
 * Définit un cookie seulement si l'utilisateur a consenti à la catégorie appropriée
 */
export function setConsentedCookie(
  name: string,
  value: string,
  options: Cookies.CookieAttributes = {},
  category: 'necessary' | 'functional' | 'analytics' = 'functional'
): void {
  if (hasConsentFor(category)) {
    Cookies.set(name, value, options);
  } else {
    console.warn(`Cookie ${name} non défini : consentement manquant pour la catégorie ${category}`);
  }
}

/**
 * Récupère un cookie seulement si l'utilisateur a consenti à la catégorie appropriée
 */
export function getConsentedCookie(
  name: string,
  category: 'necessary' | 'functional' | 'analytics' = 'functional'
): string | undefined {
  if (hasConsentFor(category)) {
    return Cookies.get(name);
  }
  return undefined;
}

/**
 * Supprime un cookie
 */
export function removeConsentedCookie(name: string): void {
  Cookies.remove(name);
}

/**
 * Nettoie tous les cookies d'une catégorie donnée
 */
export function cleanupCookiesByCategory(category: 'functional' | 'analytics'): void {
  if (!hasConsentFor(category)) {
    const cookiesToClean = getCookieNamesByCategory(category);
    cookiesToClean.forEach(cookieName => {
      Cookies.remove(cookieName);
    });
  }
}

/**
 * Retourne la liste des noms de cookies par catégorie
 */
function getCookieNamesByCategory(category: 'functional' | 'analytics'): string[] {
  const cookieMap = {
    functional: [
      'selectedPillars',
      'selectedPrograms',
      'selectedThematics',
      'selectedDestinations'
    ],
    analytics: [
      // Les cookies analytics seront ajoutés ici quand ils seront implémentés
      // Exemple: '_ga', '_gid', '_gat', etc.
    ]
  };

  return cookieMap[category] || [];
}
