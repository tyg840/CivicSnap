export interface TorontoWard {
  id: number;
  name: string;
  label: string;
  center: {
    lat: number;
    lng: number;
  };
}

export const TORONTO_WARDS_25: TorontoWard[] = [
  { id: 1, name: "Etobicoke North", label: "Ward 1 - Etobicoke North", center: { lat: 43.737, lng: -79.588 } },
  { id: 2, name: "Etobicoke Centre", label: "Ward 2 - Etobicoke Centre", center: { lat: 43.675, lng: -79.552 } },
  { id: 3, name: "Etobicoke-Lakeshore", label: "Ward 3 - Etobicoke-Lakeshore", center: { lat: 43.613, lng: -79.512 } },
  { id: 4, name: "Parkdale-High Park", label: "Ward 4 - Parkdale-High Park", center: { lat: 43.645, lng: -79.465 } },
  { id: 5, name: "York South-Weston", label: "Ward 5 - York South-Weston", center: { lat: 43.695, lng: -79.49 } },
  { id: 6, name: "York Centre", label: "Ward 6 - York Centre", center: { lat: 43.745, lng: -79.445 } },
  { id: 7, name: "Humber River-Black Creek", label: "Ward 7 - Humber River-Black Creek", center: { lat: 43.755, lng: -79.515 } },
  { id: 8, name: "Eglinton-Lawrence", label: "Ward 8 - Eglinton-Lawrence", center: { lat: 43.716, lng: -79.42 } },
  { id: 9, name: "Davenport", label: "Ward 9 - Davenport", center: { lat: 43.665, lng: -79.438 } },
  { id: 10, name: "Spadina-Fort York", label: "Ward 10 - Spadina-Fort York", center: { lat: 43.641, lng: -79.395 } },
  { id: 11, name: "University-Rosedale", label: "Ward 11 - University-Rosedale", center: { lat: 43.667, lng: -79.395 } },
  { id: 12, name: "Toronto-St. Paul's", label: "Ward 12 - Toronto-St. Paul's", center: { lat: 43.69, lng: -79.405 } },
  { id: 13, name: "Toronto Centre", label: "Ward 13 - Toronto Centre", center: { lat: 43.657, lng: -79.373 } },
  { id: 14, name: "Toronto-Danforth", label: "Ward 14 - Toronto-Danforth", center: { lat: 43.675, lng: -79.34 } },
  { id: 15, name: "Don Valley West", label: "Ward 15 - Don Valley West", center: { lat: 43.725, lng: -79.37 } },
  { id: 16, name: "Don Valley East", label: "Ward 16 - Don Valley East", center: { lat: 43.75, lng: -79.335 } },
  { id: 17, name: "Don Valley North", label: "Ward 17 - Don Valley North", center: { lat: 43.785, lng: -79.355 } },
  { id: 18, name: "Willowdale", label: "Ward 18 - Willowdale", center: { lat: 43.775, lng: -79.415 } },
  { id: 19, name: "Beaches-East York", label: "Ward 19 - Beaches-East York", center: { lat: 43.684, lng: -79.305 } },
  { id: 20, name: "Scarborough Southwest", label: "Ward 20 - Scarborough Southwest", center: { lat: 43.715, lng: -79.265 } },
  { id: 21, name: "Scarborough Centre", label: "Ward 21 - Scarborough Centre", center: { lat: 43.755, lng: -79.255 } },
  { id: 22, name: "Scarborough-Agincourt", label: "Ward 22 - Scarborough-Agincourt", center: { lat: 43.79, lng: -79.29 } },
  { id: 23, name: "Scarborough North", label: "Ward 23 - Scarborough North", center: { lat: 43.815, lng: -79.255 } },
  { id: 24, name: "Scarborough-Guildwood", label: "Ward 24 - Scarborough-Guildwood", center: { lat: 43.76, lng: -79.18 } },
  { id: 25, name: "Scarborough-Rouge Park", label: "Ward 25 - Scarborough-Rouge Park", center: { lat: 43.805, lng: -79.155 } },
];

const distanceSquared = (lat: number, lng: number, ward: TorontoWard) => {
  const latDistance = lat - ward.center.lat;
  const lngDistance = lng - ward.center.lng;
  return latDistance * latDistance + lngDistance * lngDistance;
};

export const getApproximateTorontoWard = (lat: number, lng: number) => {
  return TORONTO_WARDS_25.reduce((closest, ward) => {
    return distanceSquared(lat, lng, ward) < distanceSquared(lat, lng, closest) ? ward : closest;
  }, TORONTO_WARDS_25[0]);
};
