import { useState, useEffect, useCallback } from 'react';
import SearchBar       from './components/SearchBar.jsx';
import CurrentWeather  from './components/CurrentWeather.jsx';
import WeatherDetails  from './components/WeatherDetails.jsx';
import HourlyChart     from './components/HourlyChart.jsx';
import ForecastCard    from './components/ForecastCard.jsx';
import LiveClock       from './components/LiveClock.jsx';
import { useWeather }  from './hooks/useWeather.js';
import { groupForecastByDay, getHourlyData } from './utils/helpers.js';
import './App.css';

// Injected by Vite at build time via --build-arg in Docker
const ENV_LABEL = import.meta.env.VITE_ENV_LABEL || 'development';
const IS_TEST   = ENV_LABEL === 'TEST';

export default function App() {
  const [units, setUnits] = useState('metric');
  const [lastCity, setLastCity] = useState('London');

  const {
    current, forecast,
    loading, error,
    fetchWeather, fetchByCoords,
  } = useWeather();

  // Load default city on mount
  useEffect(() => {
    fetchWeather('London', 'metric');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback((city) => {
    setLastCity(city);
    fetchWeather(city, units);
  }, [units, fetchWeather]);

  const handleGeolocate = useCallback((lat, lon) => {
    fetchByCoords(lat, lon, units);
  }, [units, fetchByCoords]);

  const handleUnitToggle = useCallback((newUnit) => {
    setUnits(newUnit);
    if (lastCity) fetchWeather(lastCity, newUnit);
  }, [lastCity, fetchWeather]);

  const dailyForecast = forecast ? groupForecastByDay(forecast.list) : [];
  const hourlyData    = forecast ? getHourlyData(forecast.list)      : [];

  return (
    <>
      {/* Animated gradient background */}
      <div className="app-bg" aria-hidden="true" />

      <div className="app-container">

        {/* ── Header ── */}
        <header className="app-header fade-in">
          <div className="app-title">
            <span className="logo-icon" aria-hidden="true">🌤️</span>
            <h1>WeatherSphere</h1>
            {IS_TEST && (
              <span className="env-badge test" title="Connected to TEST environment">
                ⚗️ TEST ENV
              </span>
            )}
            {ENV_LABEL === 'PRODUCTION' && (
              <span className="env-badge production" title="Production environment">
                ✅ LIVE
              </span>
            )}
          </div>
          
          <LiveClock />

          <SearchBar onSearch={handleSearch} onGeolocate={handleGeolocate} />

          <div className="unit-toggle" role="group" aria-label="Temperature unit">
            <button
              id="unit-celsius"
              className={`unit-btn ${units === 'metric' ? 'active' : ''}`}
              onClick={() => handleUnitToggle('metric')}
              aria-pressed={units === 'metric'}
            >°C</button>
            <button
              id="unit-fahrenheit"
              className={`unit-btn ${units === 'imperial' ? 'active' : ''}`}
              onClick={() => handleUnitToggle('imperial')}
              aria-pressed={units === 'imperial'}
            >°F</button>
          </div>
        </header>

        {/* ── Loading State ── */}
        {loading && (
          <div className="loading-overlay fade-in" role="status" aria-live="polite">
            <div className="loading-spinner" />
            <p className="loading-text">
              Fetching weather for{' '}
              <span className="loading-city">{lastCity}</span>...
            </p>
          </div>
        )}

        {/* ── Error State ── */}
        {error && !loading && (
          <div className="error-wrapper fade-in">
            <div className="glass-card error-card" role="alert">
              <div className="error-icon">⚠️</div>
              <h2 className="error-title">Something went wrong</h2>
              <p className="error-message">{error}</p>
            </div>
          </div>
        )}

        {/* ── Weather Dashboard ── */}
        {current && !loading && !error && (
          <>
            {/* Row 1: Current + Details */}
            <div className="main-grid">
              <div className="fade-in-d1">
                <CurrentWeather data={current} units={units} />
              </div>
              <div className="fade-in-d2">
                <WeatherDetails data={current} />
              </div>
            </div>

            {/* Row 2: 24-Hour Chart */}
            {hourlyData.length > 0 && (
              <div className="glass-card chart-card fade-in-d3">
                <h3>24-Hour Temperature Trend</h3>
                <HourlyChart data={hourlyData} units={units} />
              </div>
            )}

            {/* Row 3: 5-Day Forecast */}
            {dailyForecast.length > 0 && (
              <div className="forecast-row" id="forecast-row">
                {dailyForecast.map((day, i) => (
                  <ForecastCard
                    key={day.date}
                    data={day}
                    units={units}
                    className={`fade-in-d${Math.min(i + 1, 5)}`}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Welcome / Empty State ── */}
        {!current && !loading && !error && (
          <div className="welcome-screen fade-in">
            <div className="welcome-emoji" aria-hidden="true">🌍</div>
            <h2 className="welcome-title">Real-Time Weather</h2>
            <p className="welcome-sub">
              Search any city worldwide or tap the location button
              for instant weather + a 5-day forecast.
            </p>
            <div className="welcome-hint">
              <span>💡</span>
              <span>{'Try searching "Mumbai", "New York" or "Tokyo"'}</span>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="app-footer">
          <p>
            Data provided by{' '}
            <a href="https://openweathermap.org" target="_blank" rel="noopener noreferrer">
              OpenWeatherMap
            </a>
            {' '}·{' '}
            Built with React + Vite · Deployed via Jenkins + Docker on AWS EC2
          </p>
        </footer>

      </div>
    </>
  );
}
