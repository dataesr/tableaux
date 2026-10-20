export const formatToMillions = (amount: number, precision = 1): string => {
  const millions = amount / 1_000_000;
  return `${millions.toFixed(precision)} M€`;
};

// formatToMillions but with langage => can replace formatToMillions
export const formatToMillionsLang = (
  amount: number,
  precision = 1,
  lang: "fr" | "en" = "fr",
): string => {
  const millions = amount / 1_000_000;
  const formatted = millions.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return lang === "fr" ? `${formatted}\u00A0M€` : `€${formatted}M`;
};

export const formatToThousands = (amount: number): string => {
  const thousands = amount / 1_000;
  return `${thousands.toFixed(1)} K€`;
};

export const formatToPercent = (amount: number): string => {
  return `${amount.toFixed(1)} %`;
};

// formatToPercent but with langage => can replace formatToPercent
export const formatToPercentLang = (
  amount: number,
  lang: "fr" | "en" = "fr",
): string => {
  const formatted = amount.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return lang === "fr" ? `${formatted}\u00A0%` : `${formatted}%`;
};

export const formatToEuro = (amount: number): string => {
  return `${amount.toFixed(0)} €`;
};

export const formatToRates = (value: number): string => {
  return `${(value * 100).toFixed(1)} %`;
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString("fr-FR");
};

// formatNumber but with langage => can replace formatNumber
export const formatNumberLang = (value: number, lang: "fr" | "en" = "fr"): string =>
  value.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB");

export const formatCurrency = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)} Md€`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} M€`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)} K€`;
  }
  return `${amount.toFixed(0)} €`;
};

// formatCurrency for english currency
export const formatCurrencyEn = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `€${(amount / 1_000_000_000).toFixed(2)} billion`;
  }
  if (amount >= 1_000_000) {
    return `€${(amount / 1_000_000).toFixed(1)} million`;
  }
  if (amount >= 1_000) {
    return `€${(amount / 1_000).toFixed(1)} thousand`;
  }
  return `€${amount.toFixed(0)}`;
};

export function capitalize(word: string) {
  return String(word).charAt(0).toUpperCase() + String(word).slice(1);
}

export const parseMarkdown = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
};
