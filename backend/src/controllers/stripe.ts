import { type Request, type Response } from 'express';
import Stripe from 'stripe';
import config from '../config';
import { User } from '../entity/User';
import { getStripe } from '../util/stripe';
import {
  finalizePaidTicket,
  markTicketRefunded,
  releasePaidTicketHold,
} from './ticketPayments';

// Creates the organizer's Express connected account if they don't have one yet.
// The organizer never signs up on Stripe first -- we create the account on
// their behalf, then account-onboarding links drop them into Stripe's hosted
// form.
const ensureConnectedAccount = async (user: User): Promise<string> => {
  if (user.stripe_account_id != null) return user.stripe_account_id;

  const account = await getStripe().accounts.create({
    type: 'express',
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  user.stripe_account_id = account.id;
  await user.save();

  return account.id;
};

// Refreshes our cached mirror of Stripe's account status. Stripe is
// authoritative, so we re-read it whenever we retrieve the account.
const syncAccountStatus = async (
  user: User,
  account: {
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  }
): Promise<void> => {
  user.stripe_charges_enabled = account.charges_enabled;
  user.stripe_payouts_enabled = account.payouts_enabled;
  user.stripe_details_submitted = account.details_submitted;
  await user.save();
};

const isClosedAccountError = (error: unknown): boolean => {
  if (error instanceof Stripe.errors.StripePermissionError) return true;
  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    return (
      error.code === 'account_invalid' || error.code === 'resource_missing'
    );
  }
  return false;
};

const resetStripeAccount = async (user: User): Promise<void> => {
  user.stripe_account_id = null;
  user.stripe_charges_enabled = false;
  user.stripe_payouts_enabled = false;
  user.stripe_details_submitted = false;
  await user.save();
};

/**
 * Organizers must agree to the Organizer Payment Terms before connecting Stripe
 */
const acceptedPaymentTerms = async (
  user: User,
  req: Request
): Promise<boolean> => {
  if (user.payment_terms_accepted_at != null) return true;
  if (req.body?.accept_payment_terms !== true) return false;

  user.payment_terms_accepted_at = new Date();
  await user.save();
  return true;
};

const PAYMENT_TERMS_REQUIRED_MESSAGE =
  'You must agree to the Organizer Payment Terms before connecting Stripe.';

export const createConnectAccount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const user = res.locals.requestor as User;

  if (!(await acceptedPaymentTerms(user, req))) {
    return res.status(403).json({ message: PAYMENT_TERMS_REQUIRED_MESSAGE });
  }

  try {
    const accountId = await ensureConnectedAccount(user);
    return res.status(200).json({ account_id: accountId });
  } catch {
    return res
      .status(500)
      .json({ message: 'Unable to create Stripe account.' });
  }
};

export const createAccountLink = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const user = res.locals.requestor as User;

  if (!(await acceptedPaymentTerms(user, req))) {
    return res.status(403).json({ message: PAYMENT_TERMS_REQUIRED_MESSAGE });
  }

  try {
    const accountId = await ensureConnectedAccount(user);

    const accountLink = await getStripe().accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${config.webUrl}/account/stripe/refresh`,
      return_url: `${config.webUrl}/account/stripe/return`,
    });

    return res.status(200).json({ url: accountLink.url });
  } catch {
    return res
      .status(500)
      .json({ message: 'Unable to start Stripe onboarding.' });
  }
};

/**
 * Create single use login link for organizer's express account dashboard
 */
export const createLoginLink = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const user = res.locals.requestor as User;

  if (user.stripe_account_id == null) {
    return res.status(400).json({ message: 'No Stripe account connected.' });
  }

  try {
    const loginLink = await getStripe().accounts.createLoginLink(
      user.stripe_account_id
    );

    return res.status(200).json({ url: loginLink.url });
  } catch {
    // createLoginLink fails until onboarding is complete.
    return res
      .status(400)
      .json({ message: 'Stripe dashboard is not available yet.' });
  }
};

export const getConnectStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const user = res.locals.requestor as User;

  const paymentTermsAccepted = user.payment_terms_accepted_at != null;

  if (user.stripe_account_id == null) {
    return res.status(200).json({
      is_stripe_connected: false,
      stripe_charges_enabled: false,
      stripe_details_submitted: false,
      payment_terms_accepted: paymentTermsAccepted,
    });
  }

  try {
    const account = await getStripe().accounts.retrieve(user.stripe_account_id);
    await syncAccountStatus(user, account);

    return res.status(200).json({
      is_stripe_connected: true,
      stripe_charges_enabled: account.charges_enabled,
      stripe_details_submitted: account.details_submitted,
      payment_terms_accepted: paymentTermsAccepted,
    });
  } catch (error) {
    // Unlink stripe on closed accounts
    if (isClosedAccountError(error)) {
      await resetStripeAccount(user);
      return res.status(200).json({
        is_stripe_connected: false,
        stripe_charges_enabled: false,
        stripe_details_submitted: false,
        payment_terms_accepted: paymentTermsAccepted,
      });
    }

    return res
      .status(500)
      .json({ message: 'Unable to retrieve Stripe account status.' });
  }
};

const syncAccountFromEvent = async (account: Stripe.Account): Promise<void> => {
  const user = await User.findOne({
    where: { stripe_account_id: account.id },
  });
  if (user == null) return;

  user.stripe_charges_enabled = account.charges_enabled ?? false;
  user.stripe_payouts_enabled = account.payouts_enabled ?? false;
  user.stripe_details_submitted = account.details_submitted ?? false;
  await user.save();
};

export const handleStripeWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const signature = req.headers['stripe-signature'];
  if (signature == null || config.stripeWebhookSecret === '') {
    return res.status(400).end();
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      signature,
      config.stripeWebhookSecret
    );
  } catch {
    return res.status(400).json({ message: 'Invalid signature.' });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await finalizePaidTicket(event.data.object.id);
        break;
      case 'payment_intent.canceled':
        await releasePaidTicketHold(event.data.object.id);
        break;
      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (charge.refunded && paymentIntentId != null) {
          await markTicketRefunded(
            paymentIntentId,
            charge.refunds?.data?.[0]?.id
          );
        }
        break;
      }
      case 'account.updated':
        await syncAccountFromEvent(event.data.object);
        break;
      default:
        break;
    }
  } catch {
    // Signal Stripe to retry.
    return res.status(500).end();
  }

  return res.status(200).json({ received: true });
};
