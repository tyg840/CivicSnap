import { getApproximateTorontoWard } from "./wards";

export interface MockLocation {
  label: string;
  address: string;
  lat: number;
  lng: number;
  ward: string;
}

export const TORONTO_FALLBACK_LOCATION: MockLocation = {
  label: "Toronto Core",
  address: "Toronto City Hall, Toronto",
  lat: 43.6532,
  lng: -79.3832,
  ward: getApproximateTorontoWard(43.6532, -79.3832).label,
};

const createKnownLocation = (location: Omit<MockLocation, "ward">): MockLocation => ({
  ...location,
  ward: getApproximateTorontoWard(location.lat, location.lng).label,
});

export const MOCK_LOCATIONS: MockLocation[] = [
  createKnownLocation({
    label: "King West",
    address: "123 King St W, Toronto",
    lat: 43.640261,
    lng: -79.420964,
  }),
  createKnownLocation({
    label: "Queen West",
    address: "450 Queen St W, Toronto",
    lat: 43.6482733,
    lng: -79.3992668,
  }),
  createKnownLocation({
    label: "Elm Street",
    address: "1428 Elm Street, Toronto",
    lat: 43.6573625,
    lng: -79.3841601,
  }),
  createKnownLocation({
    label: "Harbourfront",
    address: "235 Queens Quay W, Toronto",
    lat: 43.6389026,
    lng: -79.3828426,
  }),
  createKnownLocation({
    label: "Danforth",
    address: "760 Danforth Ave, Toronto",
    lat: 43.6796,
    lng: -79.34241,
  }),
];

const SEED_REPORT_LOCATIONS: MockLocation[] = [
  createKnownLocation({
    label: "Elm Street Seed",
    address: "142 Elm St, Toronto",
    lat: 43.6571477,
    lng: -79.3851052,
  }),
];

export const KNOWN_REPORT_LOCATIONS = [...MOCK_LOCATIONS, ...SEED_REPORT_LOCATIONS];

export const findExactMockLocation = (address: string) => {
  const normalizedAddress = address.trim().toLowerCase();
  return MOCK_LOCATIONS.find((location) => location.address.toLowerCase() === normalizedAddress) || null;
};

export const findKnownReportLocation = (address: string) => {
  const normalizedAddress = address.trim().toLowerCase();
  return KNOWN_REPORT_LOCATIONS.find((location) => location.address.toLowerCase() === normalizedAddress) || null;
};

export const resolveMockLocation = (address: string): MockLocation => {
  const normalizedAddress = address.trim().toLowerCase();
  if (!normalizedAddress) {
    return TORONTO_FALLBACK_LOCATION;
  }

  const exactMatch = findKnownReportLocation(address);
  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = MOCK_LOCATIONS.find((location) => {
    const label = location.label.toLowerCase();
    const locationAddress = location.address.toLowerCase();
    return normalizedAddress.includes(label) || locationAddress.includes(normalizedAddress);
  });
  if (partialMatch) {
    return {
      ...partialMatch,
      address: address.trim() || partialMatch.address,
    };
  }

  return {
    ...TORONTO_FALLBACK_LOCATION,
    address: address.trim() || TORONTO_FALLBACK_LOCATION.address,
  };
};
