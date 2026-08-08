import { useSyncExternalStore } from 'react';

export type KioskScanner = 'camera' | 'device';

export interface KioskConfig {
  meetup: string;
  scanner: KioskScanner;
  allowNameEntry: boolean;
}

const KEY = 'keebmeet.kiosk';

const listeners = new Set<() => void>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

// useSyncExternalStore snapshots must be referentially stable, so parse only
// when the raw value changes.
let cachedRaw: string | null = null;
let cachedConfig: KioskConfig | null = null;

const parse = (raw: string | null): KioskConfig | null => {
  if (raw == null) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<KioskConfig>;
    if (typeof parsed.meetup !== 'string') return null;
    return {
      meetup: parsed.meetup,
      scanner: parsed.scanner === 'device' ? 'device' : 'camera',
      allowNameEntry: parsed.allowNameEntry === true,
    };
  } catch {
    return null;
  }
};

export const readKioskConfig = (): KioskConfig | null => {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedConfig = parse(raw);
  }
  return cachedConfig;
};

export const enterKioskMode = (config: KioskConfig): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(config));
  } catch {
    // Still enter for the current session if storage is unavailable.
    cachedRaw = null;
    cachedConfig = config;
  }
  emit();
};

export const exitKioskMode = (): void => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore; emit still unlocks the current session.
  }
  cachedRaw = null;
  cachedConfig = null;
  emit();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
};

export const useKioskConfig = (): KioskConfig | null =>
  useSyncExternalStore(subscribe, readKioskConfig);
