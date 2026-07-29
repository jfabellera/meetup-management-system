/// <reference types="jest" />
import { type Request, type Response } from 'express';
import { In } from 'typeorm';

// ---- Mocks -----------------------------------------------------------------

jest.mock('../Server', () => ({ socket: { emit: jest.fn() } }));

jest.mock('../entity/Ticket', () => ({
  Ticket: {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  },
}));
jest.mock('../entity/Meetup', () => ({
  Meetup: { findOne: jest.fn(), findOneBy: jest.fn() },
}));
jest.mock('../entity/User', () => ({
  User: { findOne: jest.fn() },
}));
jest.mock('../entity/TicketType', () => ({
  TicketType: { findOne: jest.fn() },
}));
jest.mock('../util/eventbriteApi', () => ({
  getEventbriteAttendeeByUri: jest.fn(),
}));
jest.mock('../util/email', () => ({
  sendRsvpConfirmationEmail: jest.fn(),
  sendGuestRsvpVerificationEmail: jest.fn(),
}));
jest.mock('../util/meetupDiscordMessage', () => ({
  refreshMeetupDiscordMessage: jest.fn(),
}));
jest.mock('../util/turnstile', () => ({
  verifyTurnstileToken: jest.fn(),
}));
jest.mock('../util/guestRsvp', () => ({
  generateGuestRsvpToken: jest.fn(() => 'guest-token'),
  buildGuestRsvpConfirmLink: jest.fn(() => 'https://app.test/rsvp/confirm'),
  verifyGuestRsvpToken: jest.fn(),
}));

import { socket } from '../Server';
import { Meetup } from '../entity/Meetup';
import { Ticket } from '../entity/Ticket';
import { TicketType } from '../entity/TicketType';
import { User } from '../entity/User';
import { getEventbriteAttendeeByUri } from '../util/eventbriteApi';
import {
  sendGuestRsvpVerificationEmail,
  sendRsvpConfirmationEmail,
} from '../util/email';
import { verifyGuestRsvpToken } from '../util/guestRsvp';
import { refreshMeetupDiscordMessage } from '../util/meetupDiscordMessage';
import { verifyTurnstileToken } from '../util/turnstile';
import {
  checkInTicket,
  confirmGuestRsvp,
  createTicket,
  deleteTicket,
  getAllTickets,
  getTicket,
  getUserTickets,
  syncEventbriteAttendee,
  updateTicket,
  updateTicketViaWebhook,
} from './tickets';

const mockedTicket = jest.mocked(Ticket);
const mockedMeetup = jest.mocked(Meetup);
const mockedTicketType = jest.mocked(TicketType);
const mockedUser = jest.mocked(User);
const mockedVerifyTurnstile = jest.mocked(verifyTurnstileToken);
const mockedVerifyGuestToken = jest.mocked(verifyGuestRsvpToken);
const mockedSendGuestEmail = jest.mocked(sendGuestRsvpVerificationEmail);

// isMeetupAtCapacity now counts via a query builder; stub its getCount.
const setActiveTicketCount = (count: number): void => {
  mockedTicket.createQueryBuilder.mockReturnValue({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(count),
  } as any);
};
const mockedGetAttendee = jest.mocked(getEventbriteAttendeeByUri);
const mockedSocket = jest.mocked(socket);
const mockedRefresh = jest.mocked(refreshMeetupDiscordMessage);
const mockedSendRsvpEmail = jest.mocked(sendRsvpConfirmationEmail);

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

const mockRequest = (
  body: unknown = {},
  params: Record<string, string> = {},
  query: Record<string, unknown> = {}
): Request => ({ body, params, query }) as unknown as Request;

// Build an ISO timestamp a given number of hours from now.
const hoursFromNow = (hours: number): string =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const fakeMeetup = (overrides = {}): any => ({
  id: '10',
  default_raffle_entries: 2,
  date: hoursFromNow(1),
  utc_offset: 0,
  duration_hours: 2,
  ...overrides,
});

const fakeRequestor = (overrides = {}): any => ({
  id: '1',
  nick_name: 'jane',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  ...overrides,
});

// createTicketSchema wraps an optional `ticket_holder` object: when present,
// every field is required; when absent, the requestor's details win.
const fakeTicketHolder = (overrides = {}): any => ({
  display_name: 'spotter',
  first_name: 'Sam',
  last_name: 'Holder',
  email: 'sam.holder@example.com',
  ...overrides,
});

const fakeAttendee = (overrides = {}): any => ({
  id: 'att-1',
  ticketClassId: 'tc-1',
  isAttending: true,
  isCheckedIn: false,
  createdAt: new Date('2026-01-01'),
  checkInStatusUpdatedAt: new Date('2026-01-02'),
  displayName: 'Eve',
  firstName: 'Eve',
  lastName: 'Stone',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedTicket.create.mockImplementation((attrs: any) => {
    // Mirror the DB assigning the id on save, so newTicket.id is available
    // afterwards (e.g. for the RSVP confirmation email / QR code).
    const ticket: any = { ...attrs };
    ticket.save = jest.fn().mockImplementation(() => {
      ticket.id = 'new-ticket-id';
      return Promise.resolve(undefined);
    });
    return ticket;
  });
  // Default: free meetup (no ticket type) and below capacity.
  mockedTicketType.findOne.mockResolvedValue(null);
  setActiveTicketCount(0);
  // Default: the guest's email isn't tied to an existing account.
  mockedUser.findOne.mockResolvedValue(null);
  // Default: captcha passes.
  mockedVerifyTurnstile.mockResolvedValue(true);
});

// ---- getAllTickets / getTicket ---------------------------------------------

describe('getAllTickets', () => {
  it('returns every ticket', async () => {
    mockedTicket.find.mockResolvedValue([{ id: '1' }, { id: '2' }] as any);
    const res = mockResponse();

    await getAllTickets(mockRequest(), res);

    expect(res.body).toEqual([{ id: '1' }, { id: '2' }]);
  });
});

describe('getTicket', () => {
  it('returns 404 when the ticket does not exist', async () => {
    mockedTicket.findOneBy.mockResolvedValue(null);
    const res = mockResponse();

    await getTicket(mockRequest({}, { ticket_id: '5' }), res);

    expect(res.statusCode).toBe(404);
  });

  it('returns the ticket when found', async () => {
    mockedTicket.findOneBy.mockResolvedValue({ id: '5' } as any);
    const res = mockResponse();

    await getTicket(mockRequest({}, { ticket_id: '5' }), res);

    expect(res.body).toEqual({ id: '5' });
  });
});

// ---- createTicket ----------------------------------------------------------

describe('createTicket', () => {
  const rsvpRequest = (body?: unknown): Request =>
    mockRequest(body ?? {}, { meetup_id: '10' });

  it('returns 404 when the meetup does not exist', async () => {
    mockedMeetup.findOne.mockResolvedValue(null);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    await createTicket(rsvpRequest(), res);

    expect(res.statusCode).toBe(404);
  });

  it('returns 400 when a guest supplies no ticket holder details', async () => {
    mockedMeetup.findOne.mockResolvedValue(fakeMeetup());
    const res = mockResponse();
    // No requestor -> guest.

    await createTicket(rsvpRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(mockedTicket.create).not.toHaveBeenCalled();
  });

  it('returns 409 when the user already has a ticket for the meetup', async () => {
    mockedMeetup.findOne.mockResolvedValue(fakeMeetup());
    mockedTicket.findOne.mockResolvedValue({ id: '99' } as any);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    await createTicket(rsvpRequest(), res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ message: 'Ticket already exists.' });
  });

  it('returns 400 when the meetup has fully ended (past its date + duration)', async () => {
    // Started 3h ago, ran for 2h -> ended 1h ago.
    mockedMeetup.findOne.mockResolvedValue(
      fakeMeetup({ date: hoursFromNow(-3), duration_hours: 2 })
    );
    mockedTicket.findOne.mockResolvedValue(null);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    await createTicket(rsvpRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Meetup has already occurred.' });
  });

  it('creates the ticket while the meetup is happening (started but not yet ended)', async () => {
    // Started 1h ago, runs for 2h -> still has 1h left.
    mockedMeetup.findOne.mockResolvedValue(
      fakeMeetup({ date: hoursFromNow(-1), duration_hours: 2 })
    );
    mockedTicket.findOne.mockResolvedValue(null);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    await createTicket(rsvpRequest(), res);

    expect(mockedTicket.create).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 when the meetup is at capacity', async () => {
    mockedMeetup.findOne.mockResolvedValue(fakeMeetup({ capacity: 5 }));
    mockedTicket.findOne.mockResolvedValue(null);
    setActiveTicketCount(5);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    await createTicket(rsvpRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Meetup is full.' });
    expect(mockedTicket.create).not.toHaveBeenCalled();
  });

  it("marks web RSVPs as 'keebmeet' without stamping the requestor's discord_id", async () => {
    mockedMeetup.findOne.mockResolvedValue(fakeMeetup({ capacity: 100 }));
    mockedTicket.findOne.mockResolvedValue(null);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor({ discord_id: 'd-99' });

    await createTicket(rsvpRequest(), res);

    // Even when the requestor has a linked Discord account, a web RSVP is not a
    // Discord RSVP: rsvp_method is the source of truth, and discord_id stays
    // null so it can't be misread as a Discord-button ticket.
    expect(mockedTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({ discord_id: null, rsvp_method: 'keebmeet' })
    );
    expect(res.statusCode).toBe(201);
  });

  it("falls back to the requestor's details when no ticket holder is supplied, then emits an update", async () => {
    mockedMeetup.findOne.mockResolvedValue(
      fakeMeetup({ default_raffle_entries: 3 })
    );
    mockedTicket.findOne.mockResolvedValue(null);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    await createTicket(rsvpRequest(), res);

    expect(mockedTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        raffle_entries: 3,
        ticket_holder_display_name: 'jane',
        ticket_holder_first_name: 'Jane',
        ticket_holder_last_name: 'Doe',
        ticket_holder_email: 'jane@example.com',
      })
    );
    expect(mockedSocket.emit).toHaveBeenCalledWith('meetup:update', {
      meetupId: '10',
    });
    expect(mockedRefresh).toHaveBeenCalledWith('10');
    expect(res.statusCode).toBe(201);
  });

  it('emails a confirmation link for a guest free RSVP instead of holding a seat', async () => {
    mockedMeetup.findOne.mockResolvedValue(
      fakeMeetup({ capacity: 100, name: 'Keeb Night' })
    );
    mockedTicket.findOne.mockResolvedValue(null);
    const res = mockResponse();
    // No requestor -> guest.

    await createTicket(rsvpRequest({ ticket_holder: fakeTicketHolder() }), res);

    expect(mockedSendGuestEmail).toHaveBeenCalledWith(
      'sam.holder@example.com',
      'Keeb Night',
      expect.any(String)
    );
    expect(mockedTicket.create).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(202);
    expect(res.body).toEqual(
      expect.objectContaining({ requiresEmailConfirmation: true })
    );
  });

  it('rejects (403) a guest whose captcha fails', async () => {
    mockedMeetup.findOne.mockResolvedValue(fakeMeetup());
    mockedVerifyTurnstile.mockResolvedValue(false);
    const res = mockResponse();

    await createTicket(rsvpRequest({ ticket_holder: fakeTicketHolder() }), res);

    expect(res.statusCode).toBe(403);
    expect(mockedSendGuestEmail).not.toHaveBeenCalled();
    expect(mockedTicket.create).not.toHaveBeenCalled();
  });

  it('rejects (409) a guest whose email already belongs to an account', async () => {
    mockedMeetup.findOne.mockResolvedValue(fakeMeetup());
    mockedUser.findOne.mockResolvedValue({ id: '42' } as any);
    const res = mockResponse();
    // No requestor -> guest.

    await createTicket(rsvpRequest({ ticket_holder: fakeTicketHolder() }), res);

    expect(res.statusCode).toBe(409);
    expect(mockedTicket.create).not.toHaveBeenCalled();
  });

  it('does not treat a logged-in user as a guest email conflict', async () => {
    mockedMeetup.findOne.mockResolvedValue(fakeMeetup());
    mockedTicket.findOne.mockResolvedValue(null);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    await createTicket(rsvpRequest(), res);

    // The account-email guard is guest-only, so the requestor's own email is
    // never checked against the User table.
    expect(mockedUser.findOne).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
  });

  it('sends the RSVP confirmation email with the saved ticket id (used for the QR code)', async () => {
    mockedMeetup.findOne.mockResolvedValue(
      fakeMeetup({ name: 'Keeb Night', address: '123 Main St' })
    );
    mockedTicket.findOne.mockResolvedValue(null);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    await createTicket(rsvpRequest(), res);

    expect(mockedSendRsvpEmail).toHaveBeenCalledWith(
      'jane@example.com',
      'Keeb Night',
      expect.any(String),
      '123 Main St',
      'new-ticket-id',
      // Free RSVP: no receipt.
      undefined
    );
    expect(res.statusCode).toBe(201);
  });

  it('accepts an RSVP with no body and falls back to the requestor (Express 5 leaves req.body undefined)', async () => {
    mockedMeetup.findOne.mockResolvedValue(fakeMeetup());
    mockedTicket.findOne.mockResolvedValue(null);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    // Genuinely undefined body — mockRequest()'s default would coerce to {}.
    const req = {
      body: undefined,
      params: { meetup_id: '10' },
      query: {},
    } as unknown as Request;
    await createTicket(req, res);

    expect(mockedTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ticket_holder_display_name: 'jane',
        ticket_holder_email: 'jane@example.com',
      })
    );
    expect(res.statusCode).toBe(201);
  });

  it('uses the supplied ticket holder details instead of the requestor when provided', async () => {
    mockedMeetup.findOne.mockResolvedValue(fakeMeetup());
    mockedTicket.findOne.mockResolvedValue(null);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    await createTicket(rsvpRequest({ ticket_holder: fakeTicketHolder() }), res);

    expect(mockedTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ticket_holder_display_name: 'spotter',
        ticket_holder_first_name: 'Sam',
        ticket_holder_last_name: 'Holder',
        ticket_holder_email: 'sam.holder@example.com',
      })
    );
    expect(res.statusCode).toBe(201);
  });

  it('rejects (400) a partial ticket holder that omits some details', async () => {
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    // first_name / last_name / email omitted.
    await createTicket(
      rsvpRequest({ ticket_holder: { display_name: 'spotter' } }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(mockedTicket.findOne).not.toHaveBeenCalled();
    expect(mockedTicket.create).not.toHaveBeenCalled();
  });

  it('rejects (400) a ticket holder with an invalid email', async () => {
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    await createTicket(
      rsvpRequest({ ticket_holder: fakeTicketHolder({ email: 'not-an-email' }) }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(mockedTicket.create).not.toHaveBeenCalled();
  });

  it('excludes refunded tickets from the duplicate check so a refunded attendee can RSVP again', async () => {
    mockedMeetup.findOne.mockResolvedValue(fakeMeetup());
    mockedTicket.findOne.mockResolvedValue(null);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor();

    await createTicket(rsvpRequest(), res);

    expect(mockedTicket.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          payment_status: In(['confirmed', 'pending', 'paid']),
        }),
      })
    );
    expect(res.statusCode).toBe(201);
  });
});

// ---- confirmGuestRsvp ------------------------------------------------------

describe('confirmGuestRsvp', () => {
  const fakeTokenData = (overrides = {}): any => ({
    meetup_id: '10',
    display_name: 'spotter',
    first_name: 'Sam',
    last_name: 'Holder',
    email: 'sam.holder@example.com',
    purpose: 'guest_rsvp',
    ...overrides,
  });

  it('returns 400 for an invalid or expired token', async () => {
    mockedVerifyGuestToken.mockReturnValue(null);
    const res = mockResponse();

    await confirmGuestRsvp(mockRequest({ token: 'bad' }), res);

    expect(res.statusCode).toBe(400);
    expect(mockedTicket.create).not.toHaveBeenCalled();
  });

  it('creates the confirmed ticket and emails the QR when the token is valid', async () => {
    mockedVerifyGuestToken.mockReturnValue(fakeTokenData());
    mockedMeetup.findOneBy.mockResolvedValue(
      fakeMeetup({ capacity: 100, slug: 'keeb-night' })
    );
    mockedTicket.findOne.mockResolvedValue(null);
    const res = mockResponse();

    await confirmGuestRsvp(mockRequest({ token: 'good' }), res);

    expect(mockedTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: null,
        rsvp_method: 'keebmeet',
        ticket_holder_email: 'sam.holder@example.com',
      })
    );
    expect(mockedSendRsvpEmail).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
  });

  it('is idempotent: a second confirmation returns 200 without a duplicate ticket', async () => {
    mockedVerifyGuestToken.mockReturnValue(fakeTokenData());
    mockedMeetup.findOneBy.mockResolvedValue(fakeMeetup({ capacity: 100 }));
    mockedTicket.findOne.mockResolvedValue({ id: '77' } as any);
    const res = mockResponse();

    await confirmGuestRsvp(mockRequest({ token: 'good' }), res);

    expect(res.statusCode).toBe(200);
    expect(mockedTicket.create).not.toHaveBeenCalled();
  });

  it('returns 409 when an account now owns the email', async () => {
    mockedVerifyGuestToken.mockReturnValue(fakeTokenData());
    mockedMeetup.findOneBy.mockResolvedValue(fakeMeetup());
    mockedUser.findOne.mockResolvedValue({ id: '42' } as any);
    const res = mockResponse();

    await confirmGuestRsvp(mockRequest({ token: 'good' }), res);

    expect(res.statusCode).toBe(409);
    expect(mockedTicket.create).not.toHaveBeenCalled();
  });

  it('returns 400 when the meetup filled up before confirmation', async () => {
    mockedVerifyGuestToken.mockReturnValue(fakeTokenData());
    mockedMeetup.findOneBy.mockResolvedValue(fakeMeetup({ capacity: 5 }));
    mockedTicket.findOne.mockResolvedValue(null);
    setActiveTicketCount(5);
    const res = mockResponse();

    await confirmGuestRsvp(mockRequest({ token: 'good' }), res);

    expect(res.statusCode).toBe(400);
    expect(mockedTicket.create).not.toHaveBeenCalled();
  });
});

// ---- updateTicket ----------------------------------------------------------

describe('updateTicket', () => {
  it('returns 400 for an invalid body', async () => {
    const res = mockResponse();

    await updateTicket(
      mockRequest({ raffle_entries: -5 }, { ticket_id: '5' }),
      res
    );

    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when the ticket does not exist', async () => {
    mockedTicket.findOne.mockResolvedValue(null);
    const res = mockResponse();

    await updateTicket(
      mockRequest({ raffle_entries: 5 }, { ticket_id: '5' }),
      res
    );

    expect(res.statusCode).toBe(404);
  });

  it('updates the provided fields, saves, and emits', async () => {
    const ticket = {
      id: '5',
      is_checked_in: false,
      raffle_entries: 1,
      raffle_wins: 0,
      meetup: { id: '10', organizers: [{ id: '13' }] },
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockedTicket.findOne.mockResolvedValue(ticket as any);
    const res = mockResponse();
    // An organizer of the meetup is allowed to change check-in status and raffle data.
    res.locals.requestor = fakeRequestor({ id: '13', is_organizer: true });

    await updateTicket(
      mockRequest(
        { is_checked_in: true, raffle_entries: 4 },
        { ticket_id: '5' }
      ),
      res
    );

    expect(ticket.is_checked_in).toBe(true);
    expect(ticket.raffle_entries).toBe(4);
    expect(ticket.raffle_wins).toBe(0); // untouched
    expect(ticket.save).toHaveBeenCalled();
    expect(mockedSocket.emit).toHaveBeenCalledWith('meetup:update', {
      meetupId: '10',
    });
    expect(res.statusCode).toBe(201);
  });

  it('lets the lead organizer (not in the co-organizer list) check a ticket out', async () => {
    const ticket = {
      id: '5',
      is_checked_in: true,
      raffle_entries: 1,
      raffle_wins: 0,
      // The lead is tracked separately and is NOT in `organizers`.
      meetup: { id: '10', organizers: [], lead_organizer: { id: '7' } },
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockedTicket.findOne.mockResolvedValue(ticket as any);
    const res = mockResponse();
    res.locals.requestor = fakeRequestor({ id: '7', is_organizer: true });

    await updateTicket(
      mockRequest({ is_checked_in: false }, { ticket_id: '5' }),
      res
    );

    expect(ticket.is_checked_in).toBe(false);
    expect(ticket.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
  });

  it('does not let a non-organizer modify their own check-in status, raffle wins, or raffle entries', async () => {
    const ticket = {
      id: '5',
      is_checked_in: false,
      raffle_entries: 1,
      raffle_wins: 0,
      user: { id: '1' },
      meetup: { id: '10' },
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockedTicket.findOne.mockResolvedValue(ticket as any);
    const res = mockResponse();
    // A regular attendee editing their own ticket.
    res.locals.requestor = fakeRequestor({
      id: '1',
      is_organizer: false,
      is_admin: false,
    });

    await updateTicket(
      mockRequest(
        { is_checked_in: true, raffle_entries: 99, raffle_wins: 5 },
        { ticket_id: '5' }
      ),
      res
    );

    // These privileged fields must be untouched for a non-organizer.
    expect(ticket.is_checked_in).toBe(false);
    expect(ticket.raffle_entries).toBe(1);
    expect(ticket.raffle_wins).toBe(0);
  });

  it('updates the ticket holder details when a full ticket_holder is provided', async () => {
    const ticket = {
      id: '5',
      ticket_holder_display_name: 'old',
      ticket_holder_first_name: 'Old',
      ticket_holder_last_name: 'Name',
      ticket_holder_email: 'old@example.com',
      meetup: { id: '10' },
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockedTicket.findOne.mockResolvedValue(ticket as any);
    const res = mockResponse();

    await updateTicket(
      mockRequest({ ticket_holder: fakeTicketHolder() }, { ticket_id: '5' }),
      res
    );

    expect(ticket.ticket_holder_display_name).toBe('spotter');
    expect(ticket.ticket_holder_first_name).toBe('Sam');
    expect(ticket.ticket_holder_last_name).toBe('Holder');
    expect(ticket.ticket_holder_email).toBe('sam.holder@example.com');
    expect(ticket.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
  });

  it('rejects (400) a partial ticket_holder without touching the ticket', async () => {
    const res = mockResponse();

    await updateTicket(
      mockRequest(
        { ticket_holder: { display_name: 'spotter' } },
        { ticket_id: '5' }
      ),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(mockedTicket.findOne).not.toHaveBeenCalled();
  });
});

// ---- deleteTicket ----------------------------------------------------------

describe('deleteTicket', () => {
  it('rejects (400) cancelling a paid ticket (the organizer refunds instead)', async () => {
    const ticket = {
      payment_status: 'paid',
      meetup: { id: '10' },
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const res = mockResponse();
    res.locals.ticket = ticket;

    await deleteTicket(mockRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(ticket.remove).not.toHaveBeenCalled();
  });

  it('rejects (400) cancelling an already-refunded ticket', async () => {
    const ticket = {
      payment_status: 'refunded',
      meetup: { id: '10' },
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const res = mockResponse();
    res.locals.ticket = ticket;

    await deleteTicket(mockRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(ticket.remove).not.toHaveBeenCalled();
  });

  it('returns 400 when the meetup has fully ended (past its date + duration)', async () => {
    const ticket = {
      payment_status: 'confirmed',
      // Started 3h ago, ran for 2h -> ended 1h ago.
      meetup: { id: '10', date: hoursFromNow(-3), duration_hours: 2 },
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const res = mockResponse();
    res.locals.ticket = ticket;

    await deleteTicket(mockRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Meetup has already occurred.' });
    expect(ticket.remove).not.toHaveBeenCalled();
  });

  it('removes the ticket while the meetup is happening (started but not yet ended)', async () => {
    const ticket = {
      // Started 1h ago, runs for 2h -> still has 1h left.
      meetup: { id: '10', date: hoursFromNow(-1), duration_hours: 2 },
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const res = mockResponse();
    res.locals.ticket = ticket;

    await deleteTicket(mockRequest(), res);

    expect(ticket.remove).toHaveBeenCalled();
    expect(mockedSocket.emit).toHaveBeenCalledWith('meetup:update', {
      meetupId: '10',
    });
    expect(mockedRefresh).toHaveBeenCalledWith('10');
    expect(res.statusCode).toBe(204);
  });
});

// ---- getUserTickets --------------------------------------------------------

describe('getUserTickets', () => {
  it("maps a user's tickets to id + meetup_id", async () => {
    mockedTicket.find.mockResolvedValue([
      { id: '1', meetup: { id: '10' } },
      { id: '2', meetup: { id: '11' } },
    ] as any);
    const res = mockResponse();

    await getUserTickets(mockRequest({}, { user_id: '1' }), res);

    expect(res.body).toEqual([
      { id: '1', meetup_id: '10' },
      { id: '2', meetup_id: '11' },
    ]);
  });
});

// ---- checkInTicket ---------------------------------------------------------

describe('checkInTicket', () => {
  it('rejects (400) Eventbrite-managed tickets', async () => {
    const res = mockResponse();
    res.locals.ticket = { eventbrite_attendee_id: 'att-1' };

    await checkInTicket(mockRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      message: 'Ticket must be checked in via Eventbrite.',
    });
  });

  it('rejects (400) a refunded ticket as invalid', async () => {
    const res = mockResponse();
    res.locals.ticket = { payment_status: 'refunded' };

    await checkInTicket(mockRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      message: 'This ticket is not valid for check-in.',
    });
  });

  it('rejects (400) a pending (unpaid) hold as invalid', async () => {
    const res = mockResponse();
    res.locals.ticket = { payment_status: 'pending' };

    await checkInTicket(mockRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      message: 'This ticket is not valid for check-in.',
    });
  });

  it('is idempotent (200) when already checked in', async () => {
    const ticket = {
      eventbrite_attendee_id: null,
      is_checked_in: true,
      save: jest.fn(),
    };
    const res = mockResponse();
    res.locals.ticket = ticket;

    await checkInTicket(mockRequest(), res);

    expect(res.statusCode).toBe(200);
    expect(ticket.save).not.toHaveBeenCalled();
  });

  it('checks in the ticket, stamps the time, and emits', async () => {
    const ticket = {
      eventbrite_attendee_id: null,
      is_checked_in: false,
      checked_in_at: null,
      meetup: { id: '10' },
      save: jest.fn().mockResolvedValue(undefined),
    };
    const res = mockResponse();
    res.locals.ticket = ticket;

    await checkInTicket(mockRequest(), res);

    expect(ticket.is_checked_in).toBe(true);
    expect(ticket.checked_in_at).toBeInstanceOf(Date);
    expect(ticket.save).toHaveBeenCalled();
    expect(mockedSocket.emit).toHaveBeenCalledWith('meetup:update', {
      meetupId: '10',
    });
    expect(res.statusCode).toBe(200);
  });
});

// ---- syncEventbriteAttendee ------------------------------------------------

describe('syncEventbriteAttendee', () => {
  const meetup = {
    id: '10',
    default_raffle_entries: 2,
    eventbriteRecord: { ticket_class_id: 'tc-1' },
  } as any;

  it('ignores attendees from a different ticket class', async () => {
    await syncEventbriteAttendee(
      fakeAttendee({ ticketClassId: 'other' }),
      meetup
    );

    expect(mockedTicket.findOne).not.toHaveBeenCalled();
  });

  it('does nothing for an unknown attendee who is not attending', async () => {
    mockedTicket.findOne.mockResolvedValue(null);

    await syncEventbriteAttendee(fakeAttendee({ isAttending: false }), meetup);

    expect(mockedTicket.create).not.toHaveBeenCalled();
  });

  it('creates a ticket for a new attending attendee', async () => {
    mockedTicket.findOne.mockResolvedValue(null);

    await syncEventbriteAttendee(fakeAttendee({ isAttending: true }), meetup);

    expect(mockedTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventbrite_attendee_id: 'att-1',
        raffle_entries: 2,
        ticket_holder_display_name: 'Eve',
      })
    );
  });

  it('removes the ticket when an existing attendee is no longer attending', async () => {
    const ticket = { remove: jest.fn().mockResolvedValue(undefined) };
    mockedTicket.findOne.mockResolvedValue(ticket as any);

    await syncEventbriteAttendee(fakeAttendee({ isAttending: false }), meetup);

    expect(ticket.remove).toHaveBeenCalled();
  });

  it('stamps checked_in_at on the first check-in', async () => {
    const checkedAt = new Date('2026-03-03');
    const ticket = {
      is_checked_in: false,
      checked_in_at: null,
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockedTicket.findOne.mockResolvedValue(ticket as any);

    await syncEventbriteAttendee(
      fakeAttendee({
        isAttending: true,
        isCheckedIn: true,
        checkInStatusUpdatedAt: checkedAt,
      }),
      meetup
    );

    expect(ticket.checked_in_at).toBe(checkedAt);
    expect(ticket.is_checked_in).toBe(true);
    expect(ticket.save).toHaveBeenCalled();
  });

  it('stamps checked_out_at when an attendee checks back out', async () => {
    const checkedAt = new Date('2026-03-04');
    const ticket = {
      is_checked_in: true,
      checked_in_at: new Date('2026-03-03'),
      checked_out_at: null,
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockedTicket.findOne.mockResolvedValue(ticket as any);

    await syncEventbriteAttendee(
      fakeAttendee({
        isAttending: true,
        isCheckedIn: false,
        checkInStatusUpdatedAt: checkedAt,
      }),
      meetup
    );

    expect(ticket.checked_out_at).toBe(checkedAt);
    expect(ticket.is_checked_in).toBe(false);
  });
});

// ---- updateTicketViaWebhook ------------------------------------------------

describe('updateTicketViaWebhook', () => {
  it('returns 404 when the meetup has no Eventbrite record', async () => {
    mockedMeetup.findOne.mockResolvedValue(null);
    const res = mockResponse();

    await updateTicketViaWebhook(
      mockRequest({ api_url: 'x' }, { meetup_id: '10' }, { token: 't' }),
      res
    );

    expect(res.statusCode).toBe(404);
  });

  it('returns 500 when fetching the attendee fails', async () => {
    mockedMeetup.findOne.mockResolvedValue({
      id: '10',
      eventbriteRecord: {
        ticket_class_id: 'tc-1',
        display_name_question_id: 'q',
      },
    } as any);
    mockedGetAttendee.mockRejectedValue(new Error('eb down'));
    const res = mockResponse();

    await updateTicketViaWebhook(
      mockRequest({ api_url: 'x' }, { meetup_id: '10' }, { token: 't' }),
      res
    );

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Unable to get Eventbrite details' });
  });

  it('returns 400 when no attendee is resolved', async () => {
    mockedMeetup.findOne.mockResolvedValue({
      id: '10',
      eventbriteRecord: {
        ticket_class_id: 'tc-1',
        display_name_question_id: 'q',
      },
    } as any);
    mockedGetAttendee.mockResolvedValue(undefined as any);
    const res = mockResponse();

    await updateTicketViaWebhook(
      mockRequest({ api_url: 'x' }, { meetup_id: '10' }, { token: 't' }),
      res
    );

    expect(res.statusCode).toBe(400);
  });

  it('syncs the attendee and emits an update on success', async () => {
    mockedMeetup.findOne.mockResolvedValue({
      id: '10',
      eventbriteRecord: {
        ticket_class_id: 'tc-1',
        display_name_question_id: 'q',
      },
    } as any);
    // A different ticket class makes the (separately tested) sync a no-op,
    // isolating the webhook's own control flow.
    mockedGetAttendee.mockResolvedValue(
      fakeAttendee({ ticketClassId: 'other' })
    );
    const res = mockResponse();

    await updateTicketViaWebhook(
      mockRequest({ api_url: 'x' }, { meetup_id: '10' }, { token: 't' }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(mockedSocket.emit).toHaveBeenCalledWith('meetup:update', {
      meetupId: '10',
    });
  });
});
