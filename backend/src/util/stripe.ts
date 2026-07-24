import Stripe from 'stripe';
import config from '../config';

// Shared Stripe client. The secret key is backend-only and never leaves the
// server — see the org credential policy.
export const stripe = new Stripe(config.stripeSecretKey);
