import {
  type PlaceDetailsInfo,
  type PlaceSuggestionInfo,
} from '@keebmeet/shared';
import axios from 'axios';
import config from '../config';

export interface GeocodeResults {
  city: string;
  state?: string;
  country: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

const getAddressComponent = (
  addressComponents: any,
  component: string
): string | undefined => {
  const filterResult = addressComponents.filter((addressComponent: any) =>
    addressComponent.types.includes(component)
  )[0];

  return filterResult != null ? filterResult.long_name : undefined;
};

export const geocode = async (address: string): Promise<GeocodeResults> => {
  const geocodeApi = 'https://maps.googleapis.com/maps/api/geocode/json';

  // Geocode address to get latitude and longitude for timezone API
  try {
    const response = await axios.get(geocodeApi, {
      params: {
        address,
        key: config.gcpApiKey,
      },
    });

    if (response.data.status === 'OK') {
      const addressComponents = response.data.results[0].address_components;

      // Get address components
      const streetNumber = getAddressComponent(
        addressComponents,
        'street_number'
      );
      const street = getAddressComponent(addressComponents, 'route');
      const city = getAddressComponent(addressComponents, 'locality');
      const country = getAddressComponent(addressComponents, 'country');
      const state = getAddressComponent(
        addressComponents,
        'administrative_area_level_1'
      );

      // Throw error if one of the address components aren't found, e.g. when
      // they enter just a city/country, that is a valid address, but not an
      // address of a venue
      if (
        streetNumber == null ||
        street == null ||
        city == null ||
        country == null
      ) {
        throw new Error('Street number, street, city, or country not found');
      }

      const results: GeocodeResults = {
        city,
        country,
        fullAddress: response.data.results[0].formatted_address,
        latitude: response.data.results[0].geometry.location.lat,
        longitude: response.data.results[0].geometry.location.lng,
      };

      // Only populate state if the country is United States
      if (results.country === 'United States') {
        results.state = state;
      }

      return results;
    } else {
      throw new Error('Could not find address');
    }
  } catch (error: any) {
    console.error('Error geocoding address: ', error.message);
    throw new Error('Invalid address');
  }
};

const nearestEstablishment = async (
  latitude: number,
  longitude: number
): Promise<any | null> => {
  const response = await axios.post(
    'https://places.googleapis.com/v1/places:searchNearby',
    {
      locationRestriction: {
        circle: { center: { latitude, longitude }, radius: 50 },
      },
      rankPreference: 'DISTANCE',
      maxResultCount: 1,
    },
    {
      headers: {
        'X-Goog-Api-Key': config.gcpApiKey,
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.types',
      },
    }
  );

  const place = response.data.places?.[0];
  const types: string[] = place?.types ?? [];

  if (!types.includes('establishment')) return null;

  return place;
};

export const findVenueName = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    const place = await nearestEstablishment(latitude, longitude);
    return place?.displayName?.text ?? null;
  } catch (error: any) {
    console.error('Error finding venue name: ', error.message);
    return null;
  }
};

export const findVenueAtPlace = async (
  placeId: string
): Promise<PlaceDetailsInfo | null> => {
  try {
    const response = await axios.get(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          'X-Goog-Api-Key': config.gcpApiKey,
          'X-Goog-FieldMask': 'location',
        },
      }
    );

    const location = response.data?.location;
    if (location == null) return null;

    const place = await nearestEstablishment(
      location.latitude,
      location.longitude
    );
    if (place?.displayName?.text == null || place.formattedAddress == null) {
      return null;
    }

    return {
      venue_name: place.displayName.text,
      address: place.formattedAddress,
    };
  } catch (error: any) {
    console.error('Error finding venue at place: ', error.message);
    return null;
  }
};

export const autocompletePlaces = async (
  query: string,
  sessionToken: string
): Promise<PlaceSuggestionInfo[]> => {
  try {
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:autocomplete',
      { input: query, sessionToken },
      {
        headers: {
          'X-Goog-Api-Key': config.gcpApiKey,
        },
      }
    );

    const suggestions = response.data.suggestions ?? [];
    return suggestions
      .map((suggestion: any) => suggestion.placePrediction)
      .filter((prediction: any) => prediction != null)
      .map((prediction: any) => ({
        place_id: prediction.placeId,
        main_text: prediction.structuredFormat?.mainText?.text ?? '',
        secondary_text: prediction.structuredFormat?.secondaryText?.text ?? '',
        is_establishment: (prediction.types ?? []).includes('establishment'),
      }));
  } catch (error: any) {
    console.error('Error autocompleting places: ', error.message);
    return [];
  }
};

export const getPlaceDetails = async (
  placeId: string,
  sessionToken: string
): Promise<PlaceDetailsInfo | null> => {
  try {
    const response = await axios.get(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        params: { sessionToken },
        headers: {
          'X-Goog-Api-Key': config.gcpApiKey,
          'X-Goog-FieldMask': 'displayName,formattedAddress,types',
        },
      }
    );

    const place = response.data;
    if (place?.formattedAddress == null) return null;

    return {
      venue_name: (place.types ?? []).includes('establishment')
        ? (place.displayName?.text ?? null)
        : null,
      address: place.formattedAddress,
    };
  } catch (error: any) {
    console.error('Error getting place details: ', error.message);
    return null;
  }
};

export const getUtcOffset = async (
  latitude: number,
  longitude: number,
  date: Date
): Promise<number> => {
  const timezoneApi = 'https://maps.googleapis.com/maps/api/timezone/json';

  // Get timezone with latitude and longitude
  try {
    const response = await axios.get(timezoneApi, {
      params: {
        location: `${latitude},${longitude}`,
        timestamp: date.getTime() / 1000,
        key: config.gcpApiKey,
      },
    });

    // Get UTC offset from response (divide by 3600 to convert to hours)
    const result = response.data;
    const utcOffset = (result.rawOffset + result.dstOffset) / 3600;
    return utcOffset;
  } catch (error: any) {
    console.error('Error getting timezone: ', error.message);
    throw error;
  }
};
