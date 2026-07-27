import { useEffect, useState } from 'react';

export interface HoldCountdown {
  msLeft: number;
  minutes: number;
  seconds: string; // Zero-padded seconds, e.g. "07".
  expired: boolean;
  urgent: boolean; // Under a minute remaining
}

/**
 * Ticks once a second toward a hold's ISO expiry. Returns null when no expiry
 * is given (e.g. a free or already-paid ticket).
 */
export const useHoldCountdown = (
  holdExpiresAt?: string | null
): HoldCountdown | null => {
  const [msLeft, setMsLeft] = useState<number | null>(() =>
    holdExpiresAt != null
      ? new Date(holdExpiresAt).getTime() - Date.now()
      : null
  );

  useEffect(() => {
    if (holdExpiresAt == null) {
      setMsLeft(null);
      return;
    }
    const target = new Date(holdExpiresAt).getTime();
    const tick = (): void => setMsLeft(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [holdExpiresAt]);

  if (msLeft == null) return null;

  const expired = msLeft <= 0;
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
  return {
    msLeft,
    minutes: Math.floor(totalSeconds / 60),
    seconds: String(totalSeconds % 60).padStart(2, '0'),
    expired,
    urgent: !expired && msLeft <= 60_000,
  };
};
