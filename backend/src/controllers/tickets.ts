import { type Request, type Response } from 'express';
import { Ticket } from '../entity/Ticket';
import { createTicketSchema, editTicketSchema } from '../util/validator';

export interface SimpleTicketInfo {
  id: number;
  meetup_id: number;
}

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
  const { ticket_id } = req.params;

  const ticket = await Ticket.findOneBy({
    id: parseInt(ticket_id),
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
  const meetup_id = parseInt(req.params.meetup_id);
  const user_id = parseInt(res.locals.requestor.id);

  const result = createTicketSchema.safeParse({ meetup_id, user_id });

  if (!result.success) {
    return res.status(400).json(result.error);
  }

  // Check if ticket already exists
  const existingTicket = await Ticket.findOneBy({
    meetup: { id: meetup_id },
    user: {
      id: user_id,
    },
  });

  if (existingTicket != null) {
    return res.status(409).json({ message: 'Ticket already exists.' });
  }

  const newTicket = Ticket.create({
    meetup: {
      id: meetup_id,
    },
    user: {
      id: user_id,
    },
  });
  await newTicket.save();

  return res.status(201).json(newTicket);
};

export const updateTicket = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticket_id } = req.params;

  const result = editTicketSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(result.error);
  }

  const ticket = await Ticket.findOneBy({
    id: parseInt(ticket_id),
  });

  if (ticket == null) {
    return res.status(404).json({ message: 'Invalid ticket ID.' });
  }

  // TODO(jan): Do we want to throw an error when meetup_id or user_id is found in req.body?
  ticket.is_checked_in = req.body.is_checked_in ?? ticket.is_checked_in;
  ticket.raffle_entries = req.body.raffle_entries ?? ticket.raffle_entries;
  ticket.raffle_wins = req.body.raffle_wins ?? ticket.raffle_wins;

  await ticket.save();

  return res.status(201).json(ticket);
};

export const deleteTicket = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticket_id } = req.params;

  const ticket = await Ticket.findOneBy({
    id: parseInt(ticket_id),
  });

  if (ticket == null) {
    return res.status(404).json({ message: 'Invalid ticket ID.' });
  }

  await ticket.remove();

  return res.status(204).end();
};

export const getUserTickets = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { user_id } = req.params;

  // TODO(jan): make this better

  const tickets = await Ticket.find({
    relations: { meetup: true },
    select: {
      id: true,
      meetup: {
        id: true,
      },
    },
    where: {
      user: {
        id: parseInt(user_id),
      },
    },
  });

  const ticketsInfo: SimpleTicketInfo[] = tickets.map((ticket) => {
    const ticketInfo: SimpleTicketInfo = {
      id: ticket.id,
      meetup_id: ticket.meetup.id,
    };
    return ticketInfo;
  });

  return res.json(ticketsInfo);
};

export const checkInTicket = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const ticket = res.locals.ticket as Ticket;

  if (ticket.is_checked_in) {
    return res
      .status(200)
      .json({ message: 'Ticket has already been checked in.' });
  }

  ticket.is_checked_in = true;
  await ticket.save();

  return res.status(200).end();
};
