// ─── Temperature ─────────────────────────────────────────────────
export const celsiusToFahrenheit = (c) => (c * 9) / 5 + 32;
export const fahrenheitToCelsius = (f) => ((f - 32) * 5) / 9;

// ─── Wind ────────────────────────────────────────────────────────
const WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const getWindDirection = (deg) => WIND_DIRS[Math.round(deg / 45) % 8];

// ─── Time Formatting ─────────────────────────────────────────────
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getDayName = (unixTimestamp) => {
  const d = new Date(unixTimestamp * 1000);
  return SHORT_DAYS[d.getDay()];
};

export const formatHour = (unixTimestamp) => {
  const d = new Date(unixTimestamp * 1000);
  const h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}${ampm}`;
};

export const formatTime = (unixTimestamp) =>
  new Date(unixTimestamp * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

// ─── Forecast Grouping ───────────────────────────────────────────
/**
 * Groups the 5-day 3-hourly forecast list into daily summaries.
 * Skips today and returns the next 5 days.
 * @param {Array} list  — forecast.list from OWM API
 * @returns {Array}     — [{date, dayName, high, low, icon, pop, description}]
 */
export const groupForecastByDay = (list) => {
  const days = {};
  const today = new Date().toDateString();

  list.forEach((item) => {
    const d = new Date(item.dt * 1000);
    const key = d.toDateString();
    if (key === today) return; // skip today
    if (!days[key]) {
      days[key] = {
        date: key,
        dayName: SHORT_DAYS[d.getDay()],
        temps: [],
        icons: [],
        pops: [],
        descriptions: [],
      };
    }
    days[key].temps.push(item.main.temp);
    days[key].icons.push(item.weather[0].icon);
    days[key].pops.push(item.pop || 0);
    days[key].descriptions.push(item.weather[0].description);
  });

  return Object.values(days)
    .slice(0, 5)
    .map((day) => ({
      date: day.date,
      dayName: day.dayName,
      high: Math.max(...day.temps),
      low: Math.min(...day.temps),
      icon: day.icons[Math.floor(day.icons.length / 2)],
      pop: Math.max(...day.pops),
      description: day.descriptions[Math.floor(day.descriptions.length / 2)],
    }));
};

/**
 * Returns the next 8 hourly entries (24 hours).
 */
export const getHourlyData = (list) =>
  list.slice(0, 8).map((item) => ({
    time: formatHour(item.dt),
    temp: item.main.temp,
    icon: item.weather[0].icon,
    description: item.weather[0].description,
    humidity: item.main.humidity,
  }));
