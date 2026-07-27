import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { type Request, type Response } from 'express';
import { LessThan } from 'typeorm';
import { socket } from '../Server';
import config from '../config';
import { AppDataSource } from '../datasource';
import { Meetup } from '../entity/Meetup';
import { Ticket } from '../entity/Ticket';
import { type TicketType } from '../entity/TicketType';
import { type User } from '../entity/User';
import { checkMeetupOrganizer } from '../middleware/authChecker';
import { sendRefundEmail, sendRsvpConfirmationEmail } from '../util/email';
import { refreshMeetupDiscordMessage } from '../util/meetupDiscordMessage';
import { countActiveTickets } from '../util/rsvp';
import { getStripe } from '../util/stripe';

dayjs.extend(utc);

const HOLD_MINUTES = 5;

/**
 * PaymentIntent states where the same intent can still be paid, so we can
 * resume a hold instead of opening a new one (which would reset the hold
 * timer).
 */
const RESUMABLE_PI_STATUSES: string[] = [
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
];

class CapacityError extends Error {}

const holdTimers = new Map<string, NodeJS.Timeout>();

const releaseExpiredHold = async (ticketId: string): Promise<void> => {
  holdTimers.delete(ticketId);
  const ticket = await Ticket.findOne({
    where: { id: ticketId },
    relations: { meetup: true },
  });
  // A paid/cancelled hold resolved before the timer fired; nothing to release.
  if (ticket == null || ticket.payment_status !== 'pending') return;

  const meetupId = ticket.meetup.id;
  await ticket.remove();
  socket.emit('meetup:update', { meetupId });
  await refreshMeetupDiscordMessage(meetupId);
};

const cancelHoldRelease = (ticketId: string): void => {
  const timer = holdTimers.get(ticketId);
  if (timer != null) {
    clearTimeout(timer);
    holdTimers.delete(ticketId);
  }
};

const scheduleHoldRelease = (ticketId: string, expiresAt: Date): void => {
  cancelHoldRelease(ticketId);
  const delay = Math.max(0, expiresAt.getTime() - Date.now());
  holdTimers.set(
    ticketId,
    setTimeout(() => void releaseExpiredHold(ticketId), delay)
  );
};

// Re-arm timers for holds already in the DB (called once on boot).
export const scheduleExistingHolds = async (): Promise<void> => {
  const holds = await Ticket.find({
    where: { payment_status: 'pending' },
    select: { id: true, hold_expires_at: true },
  });
  for (const hold of holds) {
    if (hold.hold_expires_at != null) {
      scheduleHoldRelease(hold.id, hold.hold_expires_at);
    }
  }
};

/** Ticket-holder details, defaulting to the requestor's account fields. */
export const ticketHolderFields = (
  data: {
    display_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  },
  user: User
): Pick<
  Ticket,
  | 'ticket_holder_display_name'
  | 'ticket_holder_first_name'
  | 'ticket_holder_last_name'
  | 'ticket_holder_email'
> => ({
  ticket_holder_display_name: data.display_name ?? user.nick_name,
  ticket_holder_first_name: data.first_name ?? user.first_name,
  ticket_holder_last_name: data.last_name ?? user.last_name,
  ticket_holder_email: data.email ?? user.email,
});

const formatTicketAmount = (cents: string, currency: string): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(Number(cents) / 100);

const fetchReceiptUrl = async (
  paymentIntentId: string
): Promise<string | undefined> => {
  try {
    const paymentIntent = await getStripe().paymentIntents.retrieve(
      paymentIntentId,
      { expand: ['latest_charge'] }
    );
    const charge = paymentIntent.latest_charge;
    if (charge != null && typeof charge !== 'string') {
      return charge.receipt_url ?? undefined;
    }
  } catch {
    // ignore
  }
  return undefined;
};

const buildTicketReceipt = async (
  ticket: Ticket
): Promise<{ amountPaid: string; receiptUrl?: string } | undefined> => {
  if (
    ticket.payment_status !== 'paid' ||
    ticket.amount_paid_cents == null ||
    ticket.currency == null
  ) {
    return undefined;
  }

  const amountPaid = formatTicketAmount(
    ticket.amount_paid_cents,
    ticket.currency
  );

  const receiptUrl =
    ticket.stripe_payment_intent_id != null
      ? await fetchReceiptUrl(ticket.stripe_payment_intent_id)
      : undefined;

  return { amountPaid, receiptUrl };
};

export const finalizeTicketSideEffects = async (
  ticket: Ticket,
  meetup: Meetup
): Promise<void> => {
  socket.emit('meetup:update', { meetupId: meetup.id });
  await refreshMeetupDiscordMessage(meetup.id);
  await sendRsvpConfirmationEmail(
    ticket.ticket_holder_email,
    meetup.name,
    dayjs(meetup.date)
      .utcOffset(meetup.utc_offset)
      .format('dddd, MMMM D, YYYY [at] h:mm A'),
    meetup.address,
    ticket.id,
    await buildTicketReceipt(ticket)
  );
};

/**
 * Reserve a capacity hold and open a Stripe PaymentIntent
 */
export const createPaidTicket = async (
  res: Response,
  meetup: Meetup,
  user: User,
  holder: NonNullable<ReturnType<typeof ticketHolderFields>>,
  ticketType: TicketType
): Promise<Response> => {
  const leadOrganizer = meetup.lead_organizer;
  if (
    leadOrganizer?.stripe_account_id == null ||
    !leadOrganizer.stripe_charges_enabled
  ) {
    return res
      .status(400)
      .json({ message: 'This meetup is not ready to accept payments.' });
  }

  // Serialize concurrent paid RSVPs on the meetup row so the count-then-insert
  // can't oversell.
  let ticket: Ticket;
  try {
    ticket = await AppDataSource.transaction(async (manager) => {
      await manager.findOne(Meetup, {
        where: { id: meetup.id },
        lock: { mode: 'pessimistic_write' },
      });

      if ((await countActiveTickets(meetup.id, manager)) >= meetup.capacity) {
        throw new CapacityError();
      }

      const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
      return await manager.save(
        manager.create(Ticket, {
          meetup,
          user,
          discord_id: null,
          rsvp_method: 'keebmeet',
          ticket_type: ticketType,
          payment_status: 'pending',
          raffle_entries: meetup.default_raffle_entries,
          hold_expires_at: holdExpiresAt,
          ...holder,
        })
      );
    });
  } catch (error) {
    if (error instanceof CapacityError) {
      return res.status(400).json({ message: 'Meetup is full.' });
    }
    throw error;
  }

  const amount = Number(ticketType.price_cents);
  const feeBps = Number(config.stripePlatformFeeBps) || 0;
  const applicationFee = Math.round((amount * feeBps) / 10000);

  try {
    const paymentIntent = await getStripe().paymentIntents.create(
      {
        amount,
        currency: ticketType.currency,
        automatic_payment_methods: { enabled: true },
        // Stripe rejects a zero fee; omit it when there's no platform cut.
        ...(applicationFee > 0
          ? { application_fee_amount: applicationFee }
          : {}),
        transfer_data: { destination: leadOrganizer.stripe_account_id },
        on_behalf_of: leadOrganizer.stripe_account_id,
        metadata: {
          keebmeet_ticket_id: ticket.id,
          ticket_type_id: ticketType.id,
        },
      },
      { idempotencyKey: `rsvp:${ticket.id}` }
    );

    ticket.stripe_payment_intent_id = paymentIntent.id;
    ticket.amount_paid_cents = String(amount);
    ticket.application_fee_cents = String(applicationFee);
    ticket.currency = ticketType.currency;
    await ticket.save();

    // The hold counts against availability, so tell other clients to refetch.
    socket.emit('meetup:update', { meetupId: meetup.id });
    await refreshMeetupDiscordMessage(meetup.id);

    if (ticket.hold_expires_at != null) {
      scheduleHoldRelease(ticket.id, ticket.hold_expires_at);
    }

    return res.status(201).json({
      ticketId: ticket.id,
      clientSecret: paymentIntent.client_secret,
      holdExpiresAt: ticket.hold_expires_at,
    });
  } catch (error) {
    // Release the hold if we couldn't open the payment.
    await ticket.remove();
    return res.status(502).json({ message: 'Unable to start payment.' });
  }
};

/**
 * Resume an existing pending hold on its own PaymentIntent
 */
export const resumePendingHold = async (
  res: Response,
  existingTicket: Ticket
): Promise<Response | null> => {
  const holdActive =
    existingTicket.hold_expires_at != null &&
    existingTicket.hold_expires_at > new Date();
  if (holdActive && existingTicket.stripe_payment_intent_id != null) {
    try {
      const paymentIntent = await getStripe().paymentIntents.retrieve(
        existingTicket.stripe_payment_intent_id
      );
      if (paymentIntent.status === 'succeeded') {
        // Already paid; the webhook will finalize the ticket.
        return res.status(409).json({ message: 'Ticket already exists.' });
      }
      if (
        RESUMABLE_PI_STATUSES.includes(paymentIntent.status) &&
        paymentIntent.client_secret != null
      ) {
        return res.status(200).json({
          ticketId: existingTicket.id,
          clientSecret: paymentIntent.client_secret,
          holdExpiresAt: existingTicket.hold_expires_at,
        });
      }
    } catch {
      // Fall through and replace the unusable hold below.
    }
  }

  // Expired or unusable hold. Drop it so the caller starts a fresh one.
  await existingTicket.remove();
  return null;
};

/**
 * Promote the hold to a real ticket and fire the same side effects a free RSVP
 * gets. No-op if already finalized.
 */
export const finalizePaidTicket = async (
  paymentIntentId: string
): Promise<void> => {
  const ticket = await Ticket.findOne({
    where: { stripe_payment_intent_id: paymentIntentId },
    relations: { meetup: true },
  });
  if (ticket == null || ticket.payment_status === 'paid') return;

  cancelHoldRelease(ticket.id);
  ticket.payment_status = 'paid';
  ticket.hold_expires_at = null;
  await ticket.save();

  await finalizeTicketSideEffects(ticket, ticket.meetup);
};

/**
 * Drop the abandoned hold so the seat frees immediately
 */
export const releasePaidTicketHold = async (
  paymentIntentId: string
): Promise<void> => {
  const ticket = await Ticket.findOne({
    where: { stripe_payment_intent_id: paymentIntentId },
    relations: { meetup: true },
  });
  if (ticket == null || ticket.payment_status !== 'pending') return;

  cancelHoldRelease(ticket.id);
  const meetupId = ticket.meetup.id;
  await ticket.remove();
  socket.emit('meetup:update', { meetupId });
  await refreshMeetupDiscordMessage(meetupId);
};

/**
 * Reconcile a refund the organizer issued from their dashboard
 */
export const markTicketRefunded = async (
  paymentIntentId: string,
  refundId?: string | null
): Promise<void> => {
  const ticket = await Ticket.findOne({
    where: { stripe_payment_intent_id: paymentIntentId },
    relations: { meetup: true },
  });
  if (ticket == null || ticket.payment_status === 'refunded') return;

  ticket.payment_status = 'refunded';
  if (refundId != null) ticket.stripe_refund_id = refundId;
  await ticket.save();

  const amountRefunded =
    ticket.amount_paid_cents != null && ticket.currency != null
      ? formatTicketAmount(ticket.amount_paid_cents, ticket.currency)
      : undefined;
  const receiptUrl =
    ticket.stripe_payment_intent_id != null
      ? await fetchReceiptUrl(ticket.stripe_payment_intent_id)
      : undefined;
  await sendRefundEmail(
    ticket.ticket_holder_email,
    ticket.meetup.name,
    amountRefunded,
    receiptUrl
  );

  const meetupId = ticket.meetup.id;
  socket.emit('meetup:update', { meetupId });
  await refreshMeetupDiscordMessage(meetupId);
};

export const refundTicket = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const ticket = res.locals.ticket as Ticket;
  const requestor = res.locals.requestor as User;

  // The ticket auth also lets the ticket's own owner through, so confirm the
  // requestor actually organizes this meetup before moving money.
  if (!(await checkMeetupOrganizer(ticket.meetup.id, requestor.id))) {
    return res
      .status(403)
      .json({ message: 'Only organizers can refund tickets.' });
  }

  if (ticket.payment_status !== 'paid') {
    return res
      .status(400)
      .json({ message: 'Only paid tickets can be refunded.' });
  }
  if (ticket.stripe_payment_intent_id == null) {
    return res.status(400).json({ message: 'This ticket has no payment.' });
  }

  try {
    const refund = await getStripe().refunds.create({
      payment_intent: ticket.stripe_payment_intent_id,
      reverse_transfer: true,
      refund_application_fee: true,
    });
    await markTicketRefunded(ticket.stripe_payment_intent_id, refund.id);
    return res.status(200).json({ message: 'Ticket refunded.' });
  } catch {
    return res.status(502).json({ message: 'Unable to process refund.' });
  }
};

/**
 * Garbage collector for abandoned holds. Availability already ignores expired
 * pending rows, this just clears them out.
 */
export const sweepExpiredHolds = async (): Promise<void> => {
  const expired = await Ticket.find({
    where: { payment_status: 'pending', hold_expires_at: LessThan(new Date()) },
    relations: { meetup: true },
    select: { id: true, meetup: { id: true } },
  });
  if (expired.length === 0) return;

  expired.forEach((ticket) => cancelHoldRelease(ticket.id));
  await Ticket.remove(expired);

  // Each freed seat is now available again, so refresh the affected meetups.
  const meetupIds = [...new Set(expired.map((ticket) => ticket.meetup.id))];
  for (const meetupId of meetupIds) {
    socket.emit('meetup:update', { meetupId });
    await refreshMeetupDiscordMessage(meetupId);
  }
};
