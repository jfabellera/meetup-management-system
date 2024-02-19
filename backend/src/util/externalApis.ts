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
