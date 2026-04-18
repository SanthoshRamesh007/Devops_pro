import axios from 'axios';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL  = 'https://api.openweathermap.org/geo/1.0';

const api = axios.create({ baseURL: BASE_URL });

/**
 * Fetch current weather by city name.
 * @param {string} city
 * @param {'metric'|'imperial'} units
 */
export const getCurrentWeather = (city, units = 'metric') =>
  api
    .get('/weather', { params: { q: city, appid: API_KEY, units } })
    .then((r) => r.data);

/**
 * Fetch 5-day / 3-hour forecast by city name.
 */
export const getForecast = (city, units = 'metric') =>
  api
    .get('/forecast', { params: { q: city, appid: API_KEY, units } })
    .then((r) => r.data);

/**
 * Fetch both current weather and forecast by GPS coordinates.
 */
export const getWeatherByCoords = async (lat, lon, units = 'metric') => {
  const [current, forecast] = await Promise.all([
    api.get('/weather',   { params: { lat, lon, appid: API_KEY, units } }),
    api.get('/forecast', { params: { lat, lon, appid: API_KEY, units } }),
  ]);
  return { current: current.data, forecast: forecast.data };
};

/**
 * Geocoding autocomplete — returns up to 5 city suggestions.
 */
export const searchCities = (query) =>
  axios
    .get(`${GEO_URL}/direct`, { params: { q: query, limit: 5, appid: API_KEY } })
    .then((r) => r.data);
