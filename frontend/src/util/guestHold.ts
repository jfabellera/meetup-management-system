import { type TicketHolder } from '../store/ticketSlice';

export interface GuestHold {
  ticketId: string;
  holdExpiresAt: string;
  holder: TicketHolder;
}

const KEY = 'keebmeet.guestHolds';

const readAll = (): Record<string, GuestHold> => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw != null ? (JSON.parse(raw) as Record<string, GuestHold>) : {};
  } catch {
    return {};
  }
};

const writeAll = (holds: Record<string, GuestHold>): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(holds));
  } catch {
    // Ignore write failures (private mode, quota); resume is best-effort.
  }
};

export const readGuestHold = (meetupId: string): GuestHold | null =>
  readAll()[meetupId] ?? null;

export const saveGuestHold = (meetupId: string, hold: GuestHold): void => {
  const all = readAll();
  all[meetupId] = hold;
  writeAll(all);
};

export const clearGuestHold = (meetupId: string): void => {
  const all = readAll();
  if (all[meetupId] == null) return;
  delete all[meetupId];
  writeAll(all);
};

export const pruneExpiredGuestHolds = (): void => {
  const all = readAll();
  const now = Date.now();
  let changed = false;
  for (const [meetupId, hold] of Object.entries(all)) {
    if (new Date(hold.holdExpiresAt).getTime() <= now) {
      delete all[meetupId];
      changed = true;
    }
  }
  if (changed) writeAll(all);
};
