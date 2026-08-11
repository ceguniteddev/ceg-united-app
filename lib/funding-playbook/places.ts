import type { Branch } from "@/types/funding-playbook";

const PLACES_TEXT_SEARCH_URL =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";
const PLACES_DETAILS_URL =
  "https://maps.googleapis.com/maps/api/place/details/json";
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export class PlacesApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PlacesApiError";
  }
}

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new PlacesApiError("Missing GOOGLE_PLACES_API_KEY.");
  return key;
}

interface LatLng {
  lat: number;
  lng: number;
}

export async function geocodeZip(zip: string): Promise<LatLng> {
  const key = getApiKey();
  const url = `${GEOCODE_URL}?address=${encodeURIComponent(zip)}&components=country:US&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new PlacesApiError(`Geocoding API HTTP ${res.status}`);
  const json = (await res.json()) as {
    status: string;
    results: Array<{ geometry: { location: LatLng } }>;
  };
  if (json.status !== "OK" || json.results.length === 0) {
    throw new PlacesApiError(
      `Could not geocode ZIP ${zip} (status: ${json.status})`,
    );
  }
  return json.results[0].geometry.location;
}

function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.asin(Math.sqrt(h));
}

interface TextSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: LatLng };
  rating?: number;
}

interface PlaceDetailsResult {
  formatted_phone_number?: string;
  current_opening_hours?: { open_now?: boolean; weekday_text?: string[] };
  opening_hours?: { open_now?: boolean; weekday_text?: string[] };
  url?: string;
}

async function textSearchBranches(
  query: string,
  near: LatLng,
  radiusMiles: number,
): Promise<TextSearchResult[]> {
  const key = getApiKey();
  const radiusMeters = Math.round(radiusMiles * 1609.34);
  const url =
    `${PLACES_TEXT_SEARCH_URL}?query=${encodeURIComponent(query)}` +
    `&location=${near.lat},${near.lng}&radius=${radiusMeters}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok)
    throw new PlacesApiError(`Places Text Search HTTP ${res.status}`);
  const json = (await res.json()) as {
    status: string;
    results: TextSearchResult[];
  };
  if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
    throw new PlacesApiError(
      `Places Text Search returned status ${json.status}`,
    );
  }
  return json.results ?? [];
}

async function placeDetails(placeId: string): Promise<PlaceDetailsResult> {
  const key = getApiKey();
  const fields =
    "formatted_phone_number,current_opening_hours,opening_hours,url";
  const url = `${PLACES_DETAILS_URL}?place_id=${placeId}&fields=${fields}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new PlacesApiError(`Place Details HTTP ${res.status}`);
  const json = (await res.json()) as {
    status: string;
    result: PlaceDetailsResult;
  };
  if (json.status !== "OK") {
    return {};
  }
  return json.result;
}

export async function findNearestBranches(
  lenderDisplayName: string,
  placesSearchQuery: string | undefined,
  zip: string,
  radiusMiles: number,
  limit = 5,
): Promise<Branch[]> {
  const center = await geocodeZip(zip);
  const query = placesSearchQuery ?? `${lenderDisplayName} bank branch`;
  const candidates = await textSearchBranches(query, center, radiusMiles);

  const withDistance = candidates
    .map((c) => ({
      candidate: c,
      distanceMiles: haversineMiles(center, c.geometry.location),
    }))
    .filter((c) => c.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, limit);

  const branches: Branch[] = await Promise.all(
    withDistance.map(async ({ candidate, distanceMiles }) => {
      let details: PlaceDetailsResult = {};
      try {
        details = await placeDetails(candidate.place_id);
      } catch {
        // Details best effort
      }
      const hoursSource =
        details.current_opening_hours ?? details.opening_hours;
      return {
        placeId: candidate.place_id,
        name: candidate.name,
        address: candidate.formatted_address,
        lat: candidate.geometry.location.lat,
        lng: candidate.geometry.location.lng,
        distanceMiles: Math.round(distanceMiles * 10) / 10,
        phone: details.formatted_phone_number,
        hours: hoursSource?.weekday_text,
        openNow: hoursSource?.open_now,
        rating: candidate.rating,
        googleMapsUrl: details.url,
      };
    }),
  );

  return branches;
}
