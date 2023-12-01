import axios from 'axios';

export const getUtcOffset = async (
  address: string,
  date: Date
): Promise<number> => {
  const geocodeApi = 'https://maps.googleapis.com/maps/api/geocode/json';
  const timezoneApi = 'https://maps.googleapis.com/maps/api/timezone/json';
  let latLng = null;

  // Geocode address to get latitude and longitude for timezone API
  try {
    const response = await axios.get(geocodeApi, {
      params: {
        address,
        key: process.env.GCP_API_KEY,
      },
    });

    latLng = response.data.results[0].geometry.location;
  } catch (error: any) {
    console.error('Error geocoding address: ', error.message);
    throw error;
  }

  // Get timezone with latitude and longitude
  try {
    const response = await axios.get(timezoneApi, {
      params: {
        location: `${latLng.lat},${latLng.lng}`,
        timestamp: date.getTime() / 1000,
        key: process.env.GCP_API_KEY,
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
