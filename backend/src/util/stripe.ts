import Stripe from 'stripe';
import config from '../config';

let client: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (config.stripeSecretKey === '') {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }

  client ??= new Stripe(config.stripeSecretKey);
  return client;
};
