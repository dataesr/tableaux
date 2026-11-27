export const ACCESSIBILITY_LABELS = {
  non: { fr: "Accessibilité : non conforme", en: "Accessibility: non-compliant" },
  partially: { fr: "Accessibilité : partiellement conforme", en: "Accessibility: partially compliant" },
  fully: { fr: "Accessibilité : totalement conforme", en: "Accessibility: fully compliant" },
}

export type AccessibilityStatus = keyof typeof ACCESSIBILITY_LABELS
