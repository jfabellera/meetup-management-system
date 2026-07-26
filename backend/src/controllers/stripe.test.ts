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
import { handleStripeWebhook } from './stripe';
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
