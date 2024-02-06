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
      const results: GeocodeResults = {
        city: addressComponents.filter((addressComponent: any) =>
          addressComponent.types.includes('locality')
        )[0].long_name,
        country: addressComponents.filter((addressComponent: any) =>
          addressComponent.types.includes('country')
        )[0].long_name,
        fullAddress: response.data.results[0].formatted_address,
        latitude: response.data.results[0].geometry.location.lat,
        longitude: response.data.results[0].geometry.location.lng,
      };

      if (results.country === 'United States') {
        results.state = addressComponents.filter((addressComponent: any) =>
          addressComponent.types.includes('administrative_area_level_1')
        )[0].long_name;
      }

      return results;
    } else {
      throw new Error();
    }
  } catch (error: any) {
    console.error('Error geocoding address: ', error.message);
    throw error;
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
