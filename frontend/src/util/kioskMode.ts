import { useSyncExternalStore } from 'react';

const KEY = 'keebmeet.kioskMeetup';

const listeners = new Set<() => void>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

export const readKioskMeetup = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const enterKioskMode = (meetupSlug: string): void => {
  try {
    localStorage.setItem(KEY, meetupSlug);
  } catch {
    // Still enter for the current session if storage is unavailable.
  }
  emit();
};

export const exitKioskMode = (): void => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore; emit still unlocks the current session.
  }
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

export const useKioskMeetup = (): string | null =>
  useSyncExternalStore(subscribe, readKioskMeetup);
