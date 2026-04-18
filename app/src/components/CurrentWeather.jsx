import { getWindDirection } from '../utils/helpers';

export default function CurrentWeather({ data, units }) {
  const { name, sys, main, weather, wind, visibility } = data;
  const tempUnit = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'm/s' : 'mph';
  const iconUrl  = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;

  const stats = [
    { icon: '💧', value: `${main.humidity}%`,                           label: 'Humidity'     },
    { icon: '💨', value: `${wind.speed} ${windUnit} ${getWindDirection(wind.deg)}`, label: 'Wind'  },
    { icon: '👁️', value: `${(visibility / 1000).toFixed(1)} km`,        label: 'Visibility'  },
    { icon: '🌡️', value: `${Math.round(main.temp_max)}° / ${Math.round(main.temp_min)}°`, label: 'High / Low' },
  ];

  return (
    <div className="glass-card current-weather-card">
      {/* Location */}
      <div className="weather-location">
        <span>📍</span>
        <span id="current-city">{name}, {sys.country}</span>
      </div>

      {/* Temperature + Icon row */}
      <div className="weather-main">
        <div className="temperature-display">
          <div className="temp-row">
            <span id="current-temp" className="temperature-value">
              {Math.round(main.temp)}
            </span>
            <span className="temperature-unit">{tempUnit}</span>
          </div>
          <p className="feels-like">
            Feels like {Math.round(main.feels_like)}{tempUnit}
          </p>
        </div>

        <div className="weather-icon-wrapper">
          <img
            src={iconUrl}
            alt={weather[0].description}
            className="weather-icon"
            id="weather-icon"
          />
          <p className="weather-condition">{weather[0].description}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="weather-stats">
        {stats.map((s) => (
          <div key={s.label} className="stat-item">
            <span className="stat-icon">{s.icon}</span>
            <div className="stat-info">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
