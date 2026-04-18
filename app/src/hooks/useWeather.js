import { useState, useCallback } from 'react';
import { getCurrentWeather, getForecast, getWeatherByCoords } from '../services/weatherApi';

/**
 * Custom hook that manages all weather API state.
 * Returns current weather, forecast, loading, error, and fetch functions.
 */
export const useWeather = () => {
  const [current,  setCurrent]  = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchWeather = useCallback(async (city, units = 'metric') => {
    setLoading(true);
    setError(null);
    try {
      const [curr, fore] = await Promise.all([
        getCurrentWeather(city, units),
        getForecast(city, units),
      ]);
      setCurrent(curr);
      setForecast(fore);
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(
        msg === 'city not found'
          ? `City "${city}" not found. Please check the spelling and try again.`
          : msg || 'Failed to fetch weather data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByCoords = useCallback(async (lat, lon, units = 'metric') => {
    setLoading(true);
    setError(null);
    try {
      const { current: curr, forecast: fore } = await getWeatherByCoords(lat, lon, units);
      setCurrent(curr);
      setForecast(fore);
    } catch {
      setError('Failed to fetch weather for your location. Please search manually.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { current, forecast, loading, error, fetchWeather, fetchByCoords };
};
