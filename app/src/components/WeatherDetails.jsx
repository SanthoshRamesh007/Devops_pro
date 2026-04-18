import { formatTime } from '../utils/helpers';

export default function WeatherDetails({ data }) {
  const { main, sys, wind, clouds, visibility } = data;

  const now = Date.now() / 1000;
  const isDaytime = now > sys.sunrise && now < sys.sunset;

  const details = [
    {
      id: 'pressure',
      label: 'Pressure',
      icon: '🔽',
      value: `${main.pressure} hPa`,
      sub: main.pressure > 1013 ? 'High pressure' : 'Low pressure',
    },
    {
      id: 'humidity',
      label: 'Humidity',
      icon: '💧',
      value: `${main.humidity}%`,
      progress: main.humidity,
    },
    {
      id: 'cloud-cover',
      label: 'Cloud Cover',
      icon: '☁️',
      value: `${clouds.all}%`,
      progress: clouds.all,
    },
    {
      id: 'visibility',
      label: 'Visibility',
      icon: '👁️',
      value: `${(visibility / 1000).toFixed(1)} km`,
      sub: visibility >= 10000 ? 'Excellent' : visibility >= 5000 ? 'Good' : 'Poor',
    },
    {
      id: 'sunrise',
      label: 'Sunrise',
      icon: '🌅',
      value: formatTime(sys.sunrise),
      sub: isDaytime ? '☀️ Sun is up' : 'Next sunrise',
    },
    {
      id: 'sunset',
      label: 'Sunset',
      icon: '🌇',
      value: formatTime(sys.sunset),
      sub: !isDaytime && now > sys.sunset ? '🌙 Sun has set' : 'Today',
    },
    {
      id: 'wind-gust',
      label: 'Wind Gust',
      icon: '💨',
      value: wind.gust ? `${wind.gust.toFixed(1)} m/s` : 'N/A',
      sub: wind.gust > 10 ? 'Strong gusts' : 'Calm',
    },
    {
      id: 'dew-point',
      label: 'Feels Like',
      icon: '🌡️',
      value: `${Math.round(main.feels_like)}°`,
      sub: main.feels_like < main.temp ? 'Cooler than actual' : 'Warmer than actual',
    },
  ];

  return (
    <div className="glass-card details-card">
      <h3>Weather Details</h3>
      <div className="details-grid">
        {details.map((d) => (
          <div key={d.id} className="detail-item" id={`detail-${d.id}`}>
            <div className="detail-label">
              <span>{d.icon}</span>
              {d.label}
            </div>
            <div className="detail-value">{d.value}</div>
            {d.sub && <div className="detail-sub">{d.sub}</div>}
            {d.progress !== undefined && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${d.progress}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
