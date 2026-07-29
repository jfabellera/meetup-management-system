import {
  type EventbriteAttendee,
  type SimpleTicketInfo,
  createTicketSchema,
  editTicketSchema,
} from '@keebmeet/shared';
import { type Request, type Response } from 'express';
import { ILike, In, IsNull } from 'typeorm';
import { socket } from '../Server';
import { Meetup } from '../entity/Meetup';
import { Ticket } from '../entity/Ticket';
import { TicketType } from '../entity/TicketType';
import { type User } from '../entity/User';
import { getEventbriteAttendeeByUri } from '../util/eventbriteApi';
import { refreshMeetupDiscordMessage } from '../util/meetupDiscordMessage';
import { getMeetupEnd, isMeetupAtCapacity } from '../util/rsvp';
import {
  createPaidTicket,
  finalizeTicketSideEffects,
  resumePendingHold,
  ticketHolderFields,
} from './ticketPayments';

export const getAllTickets = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const tickets = await Ticket.find();

  return res.json(tickets);
};

export const getTicket = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticket_id } = req.params as Record<string, string>;

  const ticket = await Ticket.findOneBy({
    id: ticket_id,
  });

  if (ticket == null) {
    return res.status(404).json({ message: 'Invalid ticket ID.' });
  }

  return res.json(ticket);
};

export const createTicket = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { meetup_id } = req.params as Record<string, string>;
  const user = (res.locals.requestor as User | undefined) ?? null;
  const result = createTicketSchema.safeParse(req.body ?? {});

  if (!result.success) {
    return res.status(400).json(result.error);
  }

  // Guests have no account to fall back to, so they must supply their details.
  if (user == null && result.data.ticket_holder == null) {
    return res
      .status(400)
      .json({ message: 'Ticket holder details are required.' });
  }

  const meetup = await Meetup.findOne({
    relations: { lead_organizer: true },
    where: { id: meetup_id },
  });

  if (meetup == null) {
    return res.status(404).json({ message: 'Invalid meetup ID.' });
  }

  const holder =
    user != null
      ? ticketHolderFields(result.data.ticket_holder ?? {}, user)
      : {
          ticket_holder_display_name: result.data.ticket_holder!.display_name,
          ticket_holder_first_name: result.data.ticket_holder!.first_name,
          ticket_holder_last_name: result.data.ticket_holder!.last_name,
          ticket_holder_email: result.data.ticket_holder!.email,
        };

  // A logged-in user is matched by account; a guest by their holder email.
  const existingTicket = await Ticket.findOne({
    relations: {
      meetup: true,
      user: true,
    },
    where: {
      meetup: { id: meetup.id },
      payment_status: In(['confirmed', 'pending', 'paid']),
      ...(user != null
        ? { user: { id: user.id } }
        : {
            user: IsNull(),
            ticket_holder_email: ILike(holder.ticket_holder_email),
          }),
    },
  });

  if (existingTicket != null) {
    // Only a 'pending' hold can be retried
    if (existingTicket.payment_status !== 'pending') {
      return res.status(409).json({ message: 'Ticket already exists.' });
    }
    // Resume the hold's existing payment, or drop it if it can't be reused.
    const resumed = await resumePendingHold(res, existingTicket);
    if (resumed != null) return resumed;
  }

  if (getMeetupEnd(meetup) < new Date()) {
    return res.status(400).json({ message: 'Meetup has already occurred.' });
  }

  const ticketType = await TicketType.findOne({
    where: { meetup: { id: meetup.id } },
  });
  if (ticketType != null && Number(ticketType.price_cents) > 0) {
    return await createPaidTicket(res, meetup, user, holder, ticketType);
  }

  if (await isMeetupAtCapacity(meetup.id, meetup.capacity)) {
    return res.status(400).json({ message: 'Meetup is full.' });
  }

  const newTicket = Ticket.create({
    meetup,
    user,
    // Don't add discord_id for tickets created via Keebmeet, only for Discord RSVPs
    discord_id: null,
    rsvp_method: 'keebmeet',
    raffle_entries: meetup.default_raffle_entries,
    ...holder,
  });
  await newTicket.save();

  await finalizeTicketSideEffects(newTicket, meetup);

  return res.status(201).json(newTicket);
};

export const updateTicket = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticket_id } = req.params as Record<string, string>;
  const requestor = res.locals.requestor as User | undefined;

  const result = editTicketSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(result.error);
  }

  const ticket = await Ticket.findOne({
    relations: {
      meetup: { organizers: true, lead_organizer: true },
    },
    where: {
      id: ticket_id,
    },
  });

  if (ticket == null) {
    return res.status(404).json({ message: 'Invalid ticket ID.' });
  }

  const isOrganizer =
    requestor != null &&
    (ticket.meetup.lead_organizer?.id === requestor.id ||
      (ticket.meetup.organizers?.some(
        (organizer) => organizer.id === requestor.id
      ) ??
        false));

  if (isOrganizer) {
    ticket.is_checked_in = req.body.is_checked_in ?? ticket.is_checked_in;
    ticket.raffle_entries = req.body.raffle_entries ?? ticket.raffle_entries;
    ticket.raffle_wins = req.body.raffle_wins ?? ticket.raffle_wins;
  }

  if (result.data.ticket_holder != null) {
    ticket.ticket_holder_display_name = result.data.ticket_holder.display_name;
    ticket.ticket_holder_first_name = result.data.ticket_holder.first_name;
    ticket.ticket_holder_last_name = result.data.ticket_holder.last_name;
    ticket.ticket_holder_email = result.data.ticket_holder.email;
  }

  await ticket.save();

  socket.emit('meetup:update', { meetupId: ticket.meetup.id });
  await refreshMeetupDiscordMessage(ticket.meetup.id);
  return res.status(201).json(ticket);
};

export const deleteTicket = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const ticket = res.locals.ticket as Ticket;
  const meetupId = ticket.meetup.id;

  if (
    ticket.payment_status === 'paid' ||
    ticket.payment_status === 'refunded'
  ) {
    return res.status(400).json({
      message:
        "Paid tickets can't be cancelled here — contact the organizer for a refund.",
    });
  }

  // A 'pending' hold is an abandoned checkout and is always releasable; only a
  // confirmed (free) RSVP is blocked once the meetup has occurred.
  if (
    ticket.payment_status === 'confirmed' &&
    getMeetupEnd(ticket.meetup) < new Date()
  ) {
    return res.status(400).json({ message: 'Meetup has already occurred.' });
  }

  await ticket.remove();

  socket.emit('meetup:update', { meetupId });
  await refreshMeetupDiscordMessage(meetupId);
  return res.status(204).end();
};

export const getUserTickets = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { user_id } = req.params as Record<string, string>;

  // TODO(jan): make this better

  const tickets = await Ticket.find({
    relations: { meetup: true },
    select: {
      id: true,
      payment_status: true,
      hold_expires_at: true,
      meetup: {
        id: true,
      },
    },
    where: {
      user: {
        id: user_id,
      },
      // Include 'pending' holds so the holder can resume payment, but drop
      // 'refunded' (void) ticket
      payment_status: In(['confirmed', 'paid', 'pending']),
    },
  });

  const now = new Date();
  const ticketsInfo: SimpleTicketInfo[] = tickets
    // An expired hold has released its seat, so it's no longer a reservation.
    // This is just for the case that it hasn't been swept yet
    .filter(
      (ticket) =>
        ticket.payment_status !== 'pending' ||
        (ticket.hold_expires_at != null && ticket.hold_expires_at > now)
    )
    .map((ticket) => ({
      id: ticket.id,
      meetup_id: ticket.meetup.id,
      payment_status: ticket.payment_status,
      hold_expires_at: ticket.hold_expires_at?.toISOString(),
    }));

  return res.json(ticketsInfo);
};

export const checkInTicket = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const ticket = res.locals.ticket as Ticket;

  if (
    ticket.payment_status === 'refunded' ||
    ticket.payment_status === 'pending'
  ) {
    return res
      .status(400)
      .json({ message: 'This ticket is not valid for check-in.' });
  }

  if (ticket.eventbrite_attendee_id != null) {
    return res.status(400).json({
      message: 'Ticket must be checked in via Eventbrite.',
    });
  }

  if (ticket.is_checked_in) {
    return res
      .status(200)
      .json({ message: 'Ticket has already been checked in.' });
  }

  ticket.is_checked_in = true;
  ticket.checked_in_at = new Date();
  await ticket.save();

  socket.emit('meetup:update', { meetupId: ticket.meetup.id });
  return res.status(200).end();
};

export const syncEventbriteAttendee = async (
  attendee: EventbriteAttendee,
  meetup: Meetup
): Promise<void> => {
  if (attendee.ticketClassId !== meetup.eventbriteRecord?.ticket_class_id) {
    // Ignore attendees that do not match the specified ticket class
    return;
  }

  const ticket = await Ticket.findOne({
    where: { eventbrite_attendee_id: attendee.id },
  });

  if (ticket == null) {
    if (!attendee.isAttending) {
      // Don't do anything if no ticket exists and user isn't attending
      return;
    }

    // Create ticket for new attendee
    const newTicket = Ticket.create({
      meetup,
      eventbrite_attendee_id: attendee.id,
      rsvp_method: 'eventbrite',
      created_at: attendee.createdAt,
      raffle_entries: meetup.default_raffle_entries,
      ticket_holder_display_name: attendee.displayName,
      ticket_holder_first_name: attendee.firstName,
      ticket_holder_last_name: attendee.lastName,
      is_checked_in: attendee.isCheckedIn,
      checked_in_at: attendee.isCheckedIn
        ? attendee.checkInStatusUpdatedAt
        : undefined,
    });

    await newTicket.save();
    return;
  }

  // Remove ticket if user is no longer attending
  if (!attendee.isAttending) {
    await ticket.remove();
    return;
  }

  // Update checked in timestamp on first check in
  if (
    !ticket.is_checked_in &&
    attendee.isCheckedIn &&
    ticket.checked_in_at == null
  ) {
    ticket.checked_in_at = attendee.checkInStatusUpdatedAt;
  }

  // Update checked out timestamp on latest check out
  if (ticket.is_checked_in && !attendee.isCheckedIn) {
    ticket.checked_out_at = attendee.checkInStatusUpdatedAt;
  }

  // Sync checked in status regardless of check in or check out
  ticket.is_checked_in = attendee.isCheckedIn;

  ticket.ticket_holder_display_name = attendee.displayName;
  ticket.ticket_holder_first_name = attendee.firstName;
  ticket.ticket_holder_last_name = attendee.lastName;

  await ticket.save();
};

export const updateTicketViaWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { meetup_id } = req.params as Record<string, string>;
  const { token } = req.query;
  const { api_url } = req.body;

  try {
    const meetup = await Meetup.findOne({
      relations: { eventbriteRecord: true },
      where: { id: meetup_id },
      select: {
        eventbriteRecord: {
          display_name_question_id: true,
          ticket_class_id: true,
        },
      },
    });

    if (meetup?.eventbriteRecord == null) return res.status(404).end();

    let attendee: EventbriteAttendee | undefined;
    try {
      attendee = await getEventbriteAttendeeByUri(
        String(token),
        api_url,
        meetup.eventbriteRecord.display_name_question_id
      );
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: 'Unable to get Eventbrite details' });
    }

    if (attendee == null) return res.status(400).end();

    await syncEventbriteAttendee(attendee, meetup);

    socket.emit('meetup:update', { meetupId: meetup.id });
    await refreshMeetupDiscordMessage(meetup.id);
    return res.status(200).end();
  } catch (error: any) {
    return res.status(400).end();
  }
};
