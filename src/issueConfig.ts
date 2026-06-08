export const ISSUE_CATEGORIES = [
  {
    id: "potholes",
    label: "Road Maintenance / Potholes",
    mapLabel: "ROAD",
    statsLabel: "Road Infrastructure",
  },
  {
    id: "graffiti",
    label: "Sanitation & Graffiti",
    mapLabel: "TAG",
    statsLabel: "Sanitation / Graffiti",
  },
  {
    id: "streetlights",
    label: "Utilities & Streetlights",
    mapLabel: "LAMP",
    statsLabel: "Utilities & Streetlights",
  },
  {
    id: "other",
    label: "Other Civic Issue",
    mapLabel: "OTHER",
    statsLabel: "Other Civic Issues",
  },
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number]["id"];

export const ISSUE_CATEGORY_IDS = ISSUE_CATEGORIES.map((category) => category.id);

export const getIssueCategory = (categoryId: string) =>
  ISSUE_CATEGORIES.find((category) => category.id === categoryId) || ISSUE_CATEGORIES[ISSUE_CATEGORIES.length - 1];

export const normalizeIssueCategory = (categoryId: unknown): IssueCategory => {
  if (typeof categoryId === "string" && ISSUE_CATEGORY_IDS.includes(categoryId as IssueCategory)) {
    return categoryId as IssueCategory;
  }

  return "other";
};

export const ISSUE_ANALYSIS_PROMPT = {
  system:
    "You generate municipal issue reports from images. Return only valid JSON with keys title, category, and description. category must be exactly one of: potholes, graffiti, streetlights, other. Use other when the image is unclear, unrelated, or does not fit the listed civic issue categories.",
  user:
    "Analyze this image of a civic issue. Classify it into exactly one category: potholes, graffiti, streetlights, or other. Write a concise, professional title and one clear paragraph for description. The description should explain only what is visible in the image and avoid unsupported speculation.",
};
