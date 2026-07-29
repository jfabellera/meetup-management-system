import axios from 'axios';
import config from '../config';

// Skipped when no secret is configured (e.g. local dev); a real secret must be
// set in every deployed environment.
export const verifyTurnstileToken = async (
  token: string,
  remoteIp?: string
): Promise<boolean> => {
  if (config.turnstileSecretKey === '') {
    console.warn(
      'TURNSTILE_SECRET_KEY is not set; skipping captcha verification.'
    );
    return true;
  }

  try {
    const params = new URLSearchParams({
      secret: config.turnstileSecretKey,
      response: token,
    });
    if (remoteIp != null) {
      params.append('remoteip', remoteIp);
    }

    const { data } = await axios.post<{ success: boolean }>(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    return data.success === true;
  } catch {
    return false;
  }
};
