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
    "You turn civic issue photos into short, natural reports. Return only valid JSON with keys title, category, and description. category must be exactly one of: potholes, graffiti, streetlights, other. Use other when the photo is unclear, unrelated, or does not fit the listed civic issue categories. Write like a normal person filing a city report, not like an image-captioning model.",
  user:
    "Classify the civic issue into exactly one category: potholes, graffiti, streetlights, or other. Write a simple, direct title such as Broken streetlight, Large pothole, or Graffiti on wall. Do not write titles like Image of..., Photo showing..., or Dimmed streetlight if Broken streetlight is clearer. Write one natural paragraph for description in plain language. Do not start with phrases like This image shows or The photo depicts. Mention only what can be reasonably seen, and avoid formal or awkward wording.",
};
