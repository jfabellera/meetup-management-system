/// <reference types="jest" />
import { type Request, type Response } from 'express';

// ---- Mocks -----------------------------------------------------------------

jest.mock('../Server', () => ({ socket: { emit: jest.fn() } }));
jest.mock('../datasource', () => ({
  AppDataSource: { transaction: jest.fn() },
}));
jest.mock('../entity/Meetup', () => ({ Meetup: {} }));
jest.mock('../entity/Ticket', () => ({
  Ticket: { find: jest.fn(), findOne: jest.fn() },
}));
jest.mock('../middleware/authChecker', () => ({
  checkMeetupOrganizer: jest.fn(),
}));
jest.mock('../util/email', () => ({
  sendRefundEmail: jest.fn(),
  sendRsvpConfirmationEmail: jest.fn(),
}));
jest.mock('../util/meetupDiscordMessage', () => ({
  refreshMeetupDiscordMessage: jest.fn(),
}));
jest.mock('../util/rsvp', () => ({ countActiveTickets: jest.fn() }));
jest.mock('../util/stripe', () => ({ getStripe: jest.fn() }));

import { socket } from '../Server';
import { Ticket } from '../entity/Ticket';
import { checkMeetupOrganizer } from '../middleware/authChecker';
import { sendRefundEmail } from '../util/email';
import { refreshMeetupDiscordMessage } from '../util/meetupDiscordMessage';
import { getStripe } from '../util/stripe';
import { refundTicket } from './ticketPayments';

const mockedTicket = jest.mocked(Ticket);
const mockedCheckOrganizer = jest.mocked(checkMeetupOrganizer);
const mockedGetStripe = jest.mocked(getStripe);
const mockedSendRefundEmail = jest.mocked(sendRefundEmail);
const mockedRefresh = jest.mocked(refreshMeetupDiscordMessage);
const mockedSocket = jest.mocked(socket);

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
  res.locals = {};
  return res as MockResponse;
};

const mockRequest = (): Request => ({}) as unknown as Request;

// A Stripe stub covering the refund + receipt lookup.
const stubStripe = (refundId = 're_1', receiptUrl = 'https://receipt'): void => {
  mockedGetStripe.mockReturnValue({
    refunds: { create: jest.fn().mockResolvedValue({ id: refundId }) },
    paymentIntents: {
      retrieve: jest.fn().mockResolvedValue({
        latest_charge: { receipt_url: receiptUrl },
      }),
    },
  } as any);
};

const authTicket = (overrides = {}): any => ({
  payment_status: 'paid',
  stripe_payment_intent_id: 'pi_1',
  meetup: { id: '10' },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('refundTicket', () => {
  it('rejects (403) a requestor who does not organize the meetup', async () => {
    mockedCheckOrganizer.mockResolvedValue(false);
    const res = mockResponse();
    res.locals.ticket = authTicket();
    res.locals.requestor = { id: '2' };

    await refundTicket(mockRequest(), res);

    expect(res.statusCode).toBe(403);
    expect(mockedGetStripe).not.toHaveBeenCalled();
  });

  it('rejects (400) a ticket that is not paid', async () => {
    mockedCheckOrganizer.mockResolvedValue(true);
    const res = mockResponse();
    res.locals.ticket = authTicket({ payment_status: 'confirmed' });
    res.locals.requestor = { id: '1' };

    await refundTicket(mockRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Only paid tickets can be refunded.' });
  });

  it('rejects (400) a paid ticket with no PaymentIntent', async () => {
    mockedCheckOrganizer.mockResolvedValue(true);
    const res = mockResponse();
    res.locals.ticket = authTicket({ stripe_payment_intent_id: null });
    res.locals.requestor = { id: '1' };

    await refundTicket(mockRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'This ticket has no payment.' });
  });

  it('issues a full destination-charge refund, marks the ticket refunded, and emails', async () => {
    mockedCheckOrganizer.mockResolvedValue(true);
    stubStripe('re_99', 'https://receipt/re_99');

    // markTicketRefunded reloads the ticket by PaymentIntent id.
    const stored = {
      payment_status: 'paid',
      amount_paid_cents: '2000',
      currency: 'usd',
      ticket_holder_email: 'attendee@example.com',
      stripe_payment_intent_id: 'pi_1',
      meetup: { id: '10', name: 'Keeb Night' },
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockedTicket.findOne.mockResolvedValue(stored as any);

    const res = mockResponse();
    res.locals.ticket = authTicket();
    res.locals.requestor = { id: '1' };

    await refundTicket(mockRequest(), res);

    expect(mockedGetStripe().refunds.create).toHaveBeenCalledWith({
      payment_intent: 'pi_1',
      reverse_transfer: true,
      refund_application_fee: true,
    });
    expect(stored.payment_status).toBe('refunded');
    expect((stored as any).stripe_refund_id).toBe('re_99');
    expect(mockedSendRefundEmail).toHaveBeenCalledWith(
      'attendee@example.com',
      'Keeb Night',
      '$20.00',
      'https://receipt/re_99'
    );
    expect(mockedSocket.emit).toHaveBeenCalledWith('meetup:update', {
      meetupId: '10',
    });
    expect(mockedRefresh).toHaveBeenCalledWith('10');
    expect(res.statusCode).toBe(200);
  });

  it('returns 502 when the Stripe refund fails', async () => {
    mockedCheckOrganizer.mockResolvedValue(true);
    mockedGetStripe.mockReturnValue({
      refunds: { create: jest.fn().mockRejectedValue(new Error('stripe down')) },
      paymentIntents: { retrieve: jest.fn() },
    } as any);

    const res = mockResponse();
    res.locals.ticket = authTicket();
    res.locals.requestor = { id: '1' };

    await refundTicket(mockRequest(), res);

    expect(res.statusCode).toBe(502);
    expect(mockedSendRefundEmail).not.toHaveBeenCalled();
  });
});
