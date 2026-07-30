import { type MeetupInfo } from '@keebmeet/shared';
import { useEffect, useState } from 'react';
import config from '../config';

export interface MeetupPoint {
  meetup: MeetupInfo;
  address: string;
  longitude: number;
  latitude: number;
}

// v2 discards v1 entries, which cached degraded results forever.
const CACHE_KEY = 'meetup-geocode-cache-v2';

interface CachedCoords {
  longitude: number;
  latitude: number;
  precise: boolean;
}

type Cache = Record<string, CachedCoords | null>;

const readCache = (): Cache => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Cache;
  } catch {
    return {};
  }
};

// Failures and centroid fallbacks aren't persisted so they retry next visit.
const writeCache = (cache: Cache): void => {
  const precise = Object.fromEntries(
    Object.entries(cache).filter(([, coords]) => coords?.precise)
  );
  localStorage.setItem(CACHE_KEY, JSON.stringify(precise));
};

const addressOf = (meetup: MeetupInfo): string => {
  const { location } = meetup;
  if (location.full_address != null && location.full_address !== '') {
    return location.full_address;
  }
  return [
    location.address_line_1,
    location.city,
    location.state,
    location.postal_code,
    location.country,
  ]
    .filter((part) => part != null && part !== '')
    .join(', ');
};

const STREET_LEVEL = new Set(['rooftop', 'parcel', 'point', 'interpolated']);

const geocode = async (address: string): Promise<CachedCoords | null> => {
  const url =
    'https://api.mapbox.com/search/geocode/v6/forward?' +
    new URLSearchParams({
      q: address,
      limit: '1',
      access_token: config.mapboxToken,
    }).toString();

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = (await response.json()) as {
    features: {
      geometry: { coordinates: [number, number] };
      properties: { coordinates?: { accuracy?: string } };
    }[];
  };
  const feature = data.features[0];
  if (feature == null) return null;

  const [longitude, latitude] = feature.geometry.coordinates;
  return {
    longitude,
    latitude,
    precise: STREET_LEVEL.has(feature.properties.coordinates?.accuracy ?? ''),
  };
};

/**
 * Meetups carry only a postal address, so coordinates are resolved on the
 * client via Mapbox geocoding and cached in localStorage to avoid re-hitting
 * the API for addresses seen before.
 */
export const useMeetupCoordinates = (
  meetups: MeetupInfo[] | undefined
): { points: MeetupPoint[]; isLoading: boolean } => {
  const [points, setPoints] = useState<MeetupPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (meetups == null || config.mapboxToken === '') {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void (async () => {
      const cache = readCache();
      const resolved: MeetupPoint[] = [];

      for (const meetup of meetups) {
        const address = addressOf(meetup);
        if (address === '') continue;

        let coords = cache[address];
        if (coords === undefined) {
          coords = await geocode(address);
          cache[address] = coords;
        }
        if (coords != null) {
          resolved.push({
            meetup,
            address,
            longitude: coords.longitude,
            latitude: coords.latitude,
          });
        }
      }

      if (cancelled) return;
      writeCache(cache);
      setPoints(resolved);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [meetups]);

  return { points, isLoading };
};
