/// <reference types="jest" />
import { type Request, type Response } from 'express';

// ---- Mocks -----------------------------------------------------------------

jest.mock('../config', () => ({
  __esModule: true,
  default: { stripeWebhookSecret: 'whsec_test', webUrl: 'http://localhost' },
}));
jest.mock('../entity/User', () => ({ User: { findOne: jest.fn() } }));
jest.mock('../util/stripe', () => ({ getStripe: jest.fn() }));
jest.mock('./ticketPayments', () => ({
  finalizePaidTicket: jest.fn(),
  markTicketRefunded: jest.fn(),
  releasePaidTicketHold: jest.fn(),
}));

import { getStripe } from '../util/stripe';
import { createAccountLink, handleStripeWebhook } from './stripe';
import {
  finalizePaidTicket,
  markTicketRefunded,
  releasePaidTicketHold,
} from './ticketPayments';

const mockedGetStripe = jest.mocked(getStripe);
const mockedFinalize = jest.mocked(finalizePaidTicket);
const mockedRelease = jest.mocked(releasePaidTicketHold);
const mockedRefund = jest.mocked(markTicketRefunded);

// ---- Helpers ---------------------------------------------------------------

type MockResponse = Response & { statusCode?: number; body?: unknown };

const mockResponse = (): MockResponse => {
  const res: any = {};
  res.status = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((body: unknown) => {
    res.body = body;
    return res;
  });
  res.end = jest.fn().mockImplementation(() => res);
  return res as MockResponse;
};

// Drives the webhook with a given (already-verified) Stripe event.
const invokeWebhook = async (event: unknown): Promise<MockResponse> => {
  mockedGetStripe.mockReturnValue({
    webhooks: { constructEvent: jest.fn().mockReturnValue(event) },
  } as any);
  const req = {
    headers: { 'stripe-signature': 'sig' },
    body: Buffer.from('{}'),
  } as unknown as Request;
  const res = mockResponse();
  await handleStripeWebhook(req, res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createAccountLink', () => {
  const mockUser = (overrides: Record<string, unknown> = {}): any => ({
    email: 'organizer@example.com',
    stripe_account_id: null,
    payment_terms_accepted_at: null,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  const invoke = async (
    user: any,
    body: unknown = {}
  ): Promise<MockResponse> => {
    const req = { body } as Request;
    const res = mockResponse();
    (res as any).locals = { requestor: user };
    await createAccountLink(req, res);
    return res;
  };

  const mockStripeOnboarding = (): void => {
    mockedGetStripe.mockReturnValue({
      accounts: { create: jest.fn().mockResolvedValue({ id: 'acct_1' }) },
      accountLinks: {
        create: jest.fn().mockResolvedValue({ url: 'https://stripe/onboard' }),
      },
    } as any);
  };

  it('rejects (403) when the payment terms have not been accepted', async () => {
    const user = mockUser();

    const res = await invoke(user, {});

    expect(res.statusCode).toBe(403);
    expect(user.payment_terms_accepted_at).toBeNull();
    expect(mockedGetStripe).not.toHaveBeenCalled();
  });

  it('records acceptance and starts onboarding when the user agrees', async () => {
    const user = mockUser();
    mockStripeOnboarding();

    const res = await invoke(user, { accept_payment_terms: true });

    expect(user.payment_terms_accepted_at).toBeInstanceOf(Date);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ url: 'https://stripe/onboard' });
  });

  it('skips the gate when the terms were accepted previously', async () => {
    const user = mockUser({
      payment_terms_accepted_at: new Date('2026-01-01'),
      stripe_account_id: 'acct_1',
    });
    mockStripeOnboarding();

    const res = await invoke(user, {});

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ url: 'https://stripe/onboard' });
  });
});

describe('handleStripeWebhook', () => {
  it('finalizes the ticket on payment_intent.succeeded', async () => {
    await invokeWebhook({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_1' } },
    });

    expect(mockedFinalize).toHaveBeenCalledWith('pi_1');
    expect(mockedRelease).not.toHaveBeenCalled();
  });

  it('keeps the hold on payment_intent.payment_failed so the buyer can retry', async () => {
    const res = await invokeWebhook({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_1' } },
    });

    expect(mockedRelease).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('releases the hold on payment_intent.canceled', async () => {
    await invokeWebhook({
      type: 'payment_intent.canceled',
      data: { object: { id: 'pi_1' } },
    });

    expect(mockedRelease).toHaveBeenCalledWith('pi_1');
  });

  it('marks the ticket refunded on a full charge.refunded', async () => {
    await invokeWebhook({
      type: 'charge.refunded',
      data: {
        object: {
          refunded: true,
          payment_intent: 'pi_1',
          refunds: { data: [{ id: 're_1' }] },
        },
      },
    });

    expect(mockedRefund).toHaveBeenCalledWith('pi_1', 're_1');
  });

  it('rejects (400) when the signature header is missing', async () => {
    const req = {
      headers: {},
      body: Buffer.from('{}'),
    } as unknown as Request;
    const res = mockResponse();

    await handleStripeWebhook(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedFinalize).not.toHaveBeenCalled();
  });
});
