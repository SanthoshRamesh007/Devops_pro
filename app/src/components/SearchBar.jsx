import { useState, useRef, useEffect, useCallback } from 'react';
import { searchCities } from '../services/weatherApi';

export default function SearchBar({ onSearch, onGeolocate }) {
  const [query, setQuery]             = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug]         = useState(false);
  const [geoLoading, setGeoLoading]   = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef  = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSug(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced city autocomplete
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSug(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const cities = await searchCities(query.trim());
        setSuggestions(cities);
        setShowSug(cities.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = useCallback((city) => {
    setQuery(city.name);
    setSuggestions([]);
    setShowSug(false);
    onSearch(city.name);
  }, [onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSug(false);
      onSearch(query.trim());
    }
  };

  const handleGeo = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        onGeolocate(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setGeoLoading(false);
        alert('Unable to retrieve your location. Please search manually.');
      }
    );
  };

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <form onSubmit={handleSubmit}>
        <div className="search-container">
          <input
            id="city-search-input"
            className="search-input"
            type="text"
            placeholder="Search any city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSug(true)}
            autoComplete="off"
          />
          <button
            type="button"
            id="geolocate-btn"
            className="geo-btn"
            onClick={handleGeo}
            title="Use my current location"
            aria-label="Use my location"
          >
            {geoLoading ? '⏳' : '📍'}
          </button>
          <button type="submit" id="search-submit-btn" className="search-btn">
            🔍 Search
          </button>
        </div>
      </form>

      {showSug && suggestions.length > 0 && (
        <ul className="suggestions-list" role="listbox">
          {suggestions.map((city, i) => (
            <li
              key={`${city.lat}-${city.lon}-${i}`}
              className="suggestion-item"
              role="option"
              onClick={() => handleSelect(city)}
            >
              <span>📍</span>
              <span className="sug-name">{city.name}</span>
              {city.state && <span className="country">{city.state},</span>}
              <span className="country">{city.country}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
