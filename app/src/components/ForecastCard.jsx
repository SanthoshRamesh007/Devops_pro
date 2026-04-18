export default function ForecastCard({ data, units }) {
  const { dayName, icon, high, low, description, pop } = data;
  const tempUnit = units === 'metric' ? '°C' : '°F';
  const iconUrl  = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  return (
    <div className="glass-card forecast-card">
      <div className="forecast-day">{dayName}</div>

      <img src={iconUrl} alt={description} className="forecast-icon" />

      <div className="forecast-temps">
        <span className="forecast-high">{Math.round(high)}{tempUnit}</span>
        <span className="forecast-low">{Math.round(low)}{tempUnit}</span>
      </div>

      {pop > 0.05 && (
        <div className="forecast-pop">
          💧 {Math.round(pop * 100)}%
        </div>
      )}

      <div className="forecast-desc">{description}</div>
    </div>
  );
}
