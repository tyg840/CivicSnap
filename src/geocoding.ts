import { findExactMockLocation, MockLocation, resolveMockLocation } from "./locations";
import { getApproximateTorontoWard } from "./wards";

export interface ResolvedReportLocation extends MockLocation {
  displayName?: string;
  source: "mock" | "nominatim" | "fallback" | "browser";
}

export interface LocationSuggestion {
  label: string;
  address: string;
}

const LANDMARK_ALIASES: Record<string, LocationSuggestion> = {
  "high park": { label: "High Park", address: "1873 Bloor St W, Toronto" },
  "eaton center": { label: "CF Toronto Eaton Centre", address: "220 Yonge St, Toronto" },
  "eaton centre": { label: "CF Toronto Eaton Centre", address: "220 Yonge St, Toronto" },
  "cn tower": { label: "CN Tower", address: "290 Bremner Blvd, Toronto" },
  "rogers centre": { label: "Rogers Centre", address: "1 Blue Jays Way, Toronto" },
  "scotiabank arena": { label: "Scotiabank Arena", address: "40 Bay St, Toronto" },
  "union station": { label: "Union Station", address: "65 Front St W, Toronto" },
  "toronto city hall": { label: "Toronto City Hall", address: "100 Queen St W, Toronto" },
  "yorkdale": { label: "Yorkdale Shopping Centre", address: "3401 Dufferin St, Toronto" },
  "scarborough town centre": { label: "Scarborough Town Centre", address: "300 Borough Dr, Toronto" },
};

const TYPO_SUGGESTIONS: Array<{ pattern: RegExp; suggestion: LocationSuggestion }> = [
  { pattern: /\bduferin\b/i, suggestion: { label: "Dufferin Street", address: "Dufferin St, Toronto" } },
  { pattern: /\bdufferan\b/i, suggestion: { label: "Dufferin Street", address: "Dufferin St, Toronto" } },
  { pattern: /\byoung\b/i, suggestion: { label: "Yonge Street", address: "Yonge St, Toronto" } },
  { pattern: /\byounge\b/i, suggestion: { label: "Yonge Street", address: "Yonge St, Toronto" } },
  { pattern: /\bspadina\b/i, suggestion: { label: "Spadina Avenue", address: "Spadina Ave, Toronto" } },
  { pattern: /\bbathurst\b/i, suggestion: { label: "Bathurst Street", address: "Bathurst St, Toronto" } },
  { pattern: /\beglington\b/i, suggestion: { label: "Eglinton Avenue", address: "Eglinton Ave, Toronto" } },
  { pattern: /\bbloor\b/i, suggestion: { label: "Bloor Street", address: "Bloor St, Toronto" } },
  { pattern: /\bqueen\b/i, suggestion: { label: "Queen Street", address: "Queen St, Toronto" } },
  { pattern: /\bking\b/i, suggestion: { label: "King Street", address: "King St, Toronto" } },
];

const normalizeAddress = (address: string) => address.trim().toLowerCase().replace(/\s+/g, " ");

export const getLandmarkSuggestion = (address: string) => {
  return LANDMARK_ALIASES[normalizeAddress(address)] || null;
};

export const getLocationSuggestion = (address: string) => {
  const landmarkSuggestion = getLandmarkSuggestion(address);
  if (landmarkSuggestion) {
    return landmarkSuggestion;
  }

  return TYPO_SUGGESTIONS.find(({ pattern }) => pattern.test(address))?.suggestion || null;
};

export const resolveBrowserLocation = (lat: number, lng: number): ResolvedReportLocation => {
  const ward = getApproximateTorontoWard(lat, lng);
  return {
    label: "Current Location",
    address: "Current browser location",
    displayName: `Browser location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    lat,
    lng,
    ward: ward.label,
    source: "browser",
  };
};

export const resolveFallbackLocation = (address: string): ResolvedReportLocation => {
  return {
    ...resolveMockLocation(address),
    source: "fallback",
  };
}

export const resolveReportLocation = async (address: string): Promise<ResolvedReportLocation> => {
  const landmarkSuggestion = getLandmarkSuggestion(address);
  const addressToResolve = landmarkSuggestion?.address || address;
  const exactMockLocation = findExactMockLocation(address);
  if (exactMockLocation) {
    return {
      ...exactMockLocation,
      source: "mock",
    };
  }

  try {
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(addressToResolve)}`);
    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const geocoded = (await response.json()) as {
      address: string;
      displayName?: string;
      lat: number;
      lng: number;
      ward: string;
      source: "nominatim";
    };

    return {
      label: landmarkSuggestion?.label || "Geocoded",
      address: landmarkSuggestion?.address || geocoded.address,
      displayName: geocoded.displayName,
      lat: geocoded.lat,
      lng: geocoded.lng,
      ward: geocoded.ward,
      source: "nominatim",
    };
  } catch (error) {
    console.warn("Unable to resolve report location.", error);
    throw error;
  }
};
