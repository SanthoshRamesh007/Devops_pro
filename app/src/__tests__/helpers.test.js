import { describe, it, expect } from 'vitest';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  getWindDirection,
  getDayName,
  formatHour,
} from '../utils/helpers';

// ─── Temperature Conversions ────────────────────────────────────────
describe('celsiusToFahrenheit', () => {
  it('converts 0°C → 32°F (freezing)', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
  });
  it('converts 100°C → 212°F (boiling)', () => {
    expect(celsiusToFahrenheit(100)).toBe(212);
  });
  it('converts -40°C → -40°F (crossover point)', () => {
    expect(celsiusToFahrenheit(-40)).toBe(-40);
  });
  it('converts 37°C → ~98.6°F (body temperature)', () => {
    expect(celsiusToFahrenheit(37)).toBeCloseTo(98.6, 1);
  });
});

describe('fahrenheitToCelsius', () => {
  it('converts 32°F → 0°C', () => {
    expect(fahrenheitToCelsius(32)).toBeCloseTo(0, 5);
  });
  it('converts 212°F → 100°C', () => {
    expect(fahrenheitToCelsius(212)).toBeCloseTo(100, 5);
  });
  it('is the inverse of celsiusToFahrenheit', () => {
    const original = 25;
    expect(fahrenheitToCelsius(celsiusToFahrenheit(original))).toBeCloseTo(original, 5);
  });
});

// ─── Wind Direction ─────────────────────────────────────────────────
describe('getWindDirection', () => {
  it('returns N for 0°',   () => expect(getWindDirection(0)).toBe('N'));
  it('returns N for 360°', () => expect(getWindDirection(360)).toBe('N'));
  it('returns NE for 45°', () => expect(getWindDirection(45)).toBe('NE'));
  it('returns E for 90°',  () => expect(getWindDirection(90)).toBe('E'));
  it('returns SE for 135°',() => expect(getWindDirection(135)).toBe('SE'));
  it('returns S for 180°', () => expect(getWindDirection(180)).toBe('S'));
  it('returns SW for 225°',() => expect(getWindDirection(225)).toBe('SW'));
  it('returns W for 270°', () => expect(getWindDirection(270)).toBe('W'));
  it('returns NW for 315°',() => expect(getWindDirection(315)).toBe('NW'));
});

// ─── formatHour ─────────────────────────────────────────────────────
describe('formatHour', () => {
  it('formats midnight hour as 12AM', () => {
    // Create a timestamp at exactly midnight (local time)
    const d = new Date(2025, 0, 1, 0, 0, 0);
    expect(formatHour(d.getTime() / 1000)).toMatch(/12AM/i);
  });
  it('formats midday as 12PM', () => {
    const d = new Date(2025, 0, 1, 12, 0, 0);
    expect(formatHour(d.getTime() / 1000)).toMatch(/12PM/i);
  });
  it('formats 3 PM correctly', () => {
    const d = new Date(2025, 0, 1, 15, 0, 0);
    expect(formatHour(d.getTime() / 1000)).toMatch(/3PM/i);
  });
  it('formats 6 AM correctly', () => {
    const d = new Date(2025, 0, 1, 6, 0, 0);
    expect(formatHour(d.getTime() / 1000)).toMatch(/6AM/i);
  });
});

// ─── getDayName ─────────────────────────────────────────────────────
describe('getDayName', () => {
  it('returns a short 3-letter day name', () => {
    const someDay = new Date(2025, 0, 6).getTime() / 1000; // 2025-01-06 is Monday
    expect(getDayName(someDay)).toBe('Mon');
  });
  it('returns Sun for a Sunday timestamp', () => {
    const sunday = new Date(2025, 0, 5).getTime() / 1000; // 2025-01-05 is Sunday
    expect(getDayName(sunday)).toBe('Sun');
  });
});
