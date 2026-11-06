const { VITE_APP_SERVER_URL } = import.meta.env;

type FilterValue = {
  id: string;
  label_fr: string;
  label_en: string;
};

export async function getAll(filter: string) {
  const url = `${VITE_APP_SERVER_URL}/european-projects/all-${filter}`;
  const values = await fetch(url).then((response) => response.json());
  return values;
}

export async function getPrograms(
  pillars: string[]
) {
  const url = `${VITE_APP_SERVER_URL}/european-projects/programs-from-pillars?pillars=${pillars.join("|")}`;
  const values = await fetch(url).then((response) => response.json());
  return values;
}

export async function getThematics(
  programs: string[]
) { 
  const url = `${VITE_APP_SERVER_URL}/european-projects/thematics-from-programs?programs=${programs.join("|")}`;
  const values = await fetch(url).then((response) => response.json());
  return values;
}

export async function getDestinations({ programs = [], thematics }: { programs?: string[], thematics: string[] }) {
  const url = `${VITE_APP_SERVER_URL}/european-projects/destinations-from-thematics?thematics=${thematics.join(",")}${ (programs?.length ?? 0) > 0 ? "&programs=" + programs.join(",") : "" }`;
  const values = await fetch(url).then((response) => response.json());
  return values;
}

export async function getFilters({ filterKey, pillarId, programIds, thematicIds }: { 
  filterKey: string; 
  pillarId?: string; 
  programIds?: string;
  thematicIds?: string;
}) {
  let url = `${VITE_APP_SERVER_URL}/european-projects/filters-${filterKey}`;
  
  if (filterKey === "programs" && pillarId) {
    url += `?pillarId=${pillarId}`;
  } else if (filterKey === "thematics" && programIds) {
    url += `?programIds=${programIds}`;
  } else if (filterKey === "destinations" && thematicIds) {
    // Utiliser l'endpoint existant pour les destinations
    url = `${VITE_APP_SERVER_URL}/european-projects/destinations-from-thematics?thematics=${thematicIds}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const values = await response.json();
  return values;
}

export async function getFiltersValues(
  filterKey: string,
  programId?: string
) {

  let values = [];
  if (filterKey === "countries") {
    const url = `${VITE_APP_SERVER_URL}/european-projects/filters-countries`;
    values = await fetch(url).then((response) => response.json());
    return {
      defaultId: "FRA",
      icon: "earth-fill",
      label_fr: "Pays",
      label_en: "Countries",
      title_fr: "Sélectionner un pays",
      title_en: "Select a country",
      values,
    };
  }

  if (filterKey === "extra_joint_organization") {
    return {
      defaultId: null,
      icon: "community-fill",
      label_fr: "Entités",
      label_en: "Entities",
      title_fr: "Sélectionner une entité",
      title_en: "Select an entity",
      values: [
      {
        "id": "null",
        "label_fr": "Toutes les entités",
        "label_en": "All entities"
      },
      {
        "id": "exept",
        "label_fr": "Hors OIE, OIG, entités communes",
        "label_en": "Except IOE, IGO, common entities"
      }
    ],
    };
  }

  if (filterKey === "programs") {
    const url = `${VITE_APP_SERVER_URL}/european-projects/filters-programs`;
    values = await fetch(url).then((response) => response.json());
    return {
      defaultId: "all",
      icon: "community-fill",
      label_fr: "Programmes",
      label_en: "Programs",
      title_fr: "Sélectionner un ou plusieurs programmes",
      title_en: "Select one or several programs",
      values: [
      {
        id: "all",
        label_fr: "Tous les programmes",
        label_en: "All programs"
      },
      ...values
      ],
    };
  }

    if (filterKey === "thematics") {
    const url = `${VITE_APP_SERVER_URL}/european-projects/filters-thematics${programId ? `?programId=${programId}` : ""}`;
    const valuesRes = await fetch(url).then((response) => response.json());

    let values: FilterValue[];
    if (valuesRes.length > 1) {
      values = [
      {
        id: "all",
        label_fr: "Toutes les thématiques",
        label_en: "All thematics"
      },
      ...valuesRes
      ]
    } else {
      values = valuesRes;
    }
      
    return {
      defaultId: "all",
      icon: "community-fill",
      label_fr: "Thématiques",
      label_en: "Thematics",
      title_fr: "Sélectionner une thématique",
      title_en: "Select a thematic",
      values,
    };
    }
  
  if (filterKey === "pillars") {
    const url = `${VITE_APP_SERVER_URL}/european-projects/filters-pillars`;
    const values = await fetch(url).then((response) => response.json());

    return values;
  }
  return [];
}

export async function getHierarchy({ pillarId }: { pillarId?: string }) {
  try {
    const url = `${VITE_APP_SERVER_URL}/european-projects/get-hierarchy${pillarId ? `?pillarId=${pillarId}` : ""}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const values = await response.json();
    return values;
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    // Retourner des données par défaut en cas d'erreur
    return [
      ["", "ep"],
      ["ep", "PILLAR_1"],
      ["ep", "PILLAR_2"], 
      ["ep", "PILLAR_3"],
      ["PILLAR_1", "EXCELLENT_SCIENCE_ERC"],
      ["PILLAR_1", "EXCELLENT_SCIENCE_MSCA"],
      ["PILLAR_2", "GLOBAL_CHALLENGES_HEALTH"],
      ["PILLAR_2", "GLOBAL_CHALLENGES_DIGITAL"],
      ["PILLAR_3", "INNOVATIVE_EUROPE_EIC"],
      ["EXCELLENT_SCIENCE_ERC", "ERC_SYG", 4],
      ["EXCELLENT_SCIENCE_ERC", "ERC_COG", 4],
      ["EXCELLENT_SCIENCE_MSCA", "MSCA_DN", 4],
      ["GLOBAL_CHALLENGES_HEALTH", "HEALTH_01", 4],
      ["GLOBAL_CHALLENGES_DIGITAL", "DIGITAL_01", 4],
      ["INNOVATIVE_EUROPE_EIC", "EIC_PATHFINDER", 4]
    ];
  }
}