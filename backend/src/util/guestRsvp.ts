import jwt from 'jsonwebtoken';
import config from '../config';

export interface GuestRsvpTokenData {
  meetup_id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  email: string;
  purpose: 'guest_rsvp';
}

const TOKEN_TTL = '1h';

export const generateGuestRsvpToken = (
  data: Omit<GuestRsvpTokenData, 'purpose'>
): string =>
  jwt.sign({ ...data, purpose: 'guest_rsvp' } as GuestRsvpTokenData, config.jwtSecret, {
    expiresIn: TOKEN_TTL,
  });

export const verifyGuestRsvpToken = (
  token: string
): GuestRsvpTokenData | null => {
  try {
    const data = jwt.verify(token, config.jwtSecret) as GuestRsvpTokenData;
    if (data.purpose !== 'guest_rsvp') return null;
    return data;
  } catch {
    return null;
  }
};

export const buildGuestRsvpConfirmLink = (token: string): string =>
  `${config.webUrl}/rsvp/confirm?token=${encodeURIComponent(token)}`;

export interface GuestCancelTokenData {
  ticket_id: string;
  purpose: 'guest_cancel';
}

export const generateGuestCancelToken = (
  ticketId: string,
  expiresAt: Date
): string =>
  jwt.sign(
    { ticket_id: ticketId, purpose: 'guest_cancel' } as GuestCancelTokenData,
    config.jwtSecret,
    {
      expiresIn: Math.max(
        1,
        Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      ),
    }
  );

export const verifyGuestCancelToken = (
  token: string
): GuestCancelTokenData | null => {
  try {
    const data = jwt.verify(token, config.jwtSecret) as GuestCancelTokenData;
    if (data.purpose !== 'guest_cancel') return null;
    return data;
  } catch {
    return null;
  }
};

export const buildGuestCancelLink = (token: string): string =>
  `${config.webUrl}/rsvp/cancel?token=${encodeURIComponent(token)}`;
