export const AGE_CLASSES = [
  { key: "35 ans et moins", label: "≤ 35 ans", color: "fm-age-35-et-moins-ec" },
  { key: "36 à 55 ans", label: "36 – 55 ans", color: "fm-age-36-55-ec" },
  { key: "56 ans et plus", label: "≥ 56 ans", color: "fm-age-56-et-plus-ec" },
];

export const AGE_UNSPECIFIED = {
  key: "Non précisé",
  label: "Non précisé",
  color: "blue-france-main-525",
};

export const AGE_CLASSES_WITH_UNSPECIFIED = [...AGE_CLASSES, AGE_UNSPECIFIED];
