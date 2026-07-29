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
