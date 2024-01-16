import { Request, Response } from 'express';
import { Ticket } from '../entity/Ticket';
import { validateTicket } from '../util/validator';

export interface SimpleTicketInfo {
  id: number;
  meetup_id: number;
}

export const getAllTickets = async (req: Request, res: Response) => {
  const tickets = await Ticket.find();

  return res.json(tickets);
};

export const getTicket = async (req: Request, res: Response) => {
  const { ticket_id } = req.params;

  const ticket = await Ticket.findOneBy({
    id: parseInt(ticket_id),
  });

  if (!ticket) {
    return res.status(404).json({ message: 'Invalid ticket ID.' });
  }

  return res.json(ticket);
};

export const createTicket = async (req: Request, res: Response) => {
  const meetup_id = parseInt(req.params.meetup_id);
  const user_id = parseInt(res.locals.requestor.id);

  const { error, value } = validateTicket({
    meetup_id,
    user_id,
  });

  if (error) {
    return res.status(400).json(error.details);
  }

  // Check if ticket already exists
  const existingTicket = await Ticket.findOneBy({
    meetup_id: value.meetup_id,
    user_id: value.user_id,
  });

  if (existingTicket) {
    return res.status(409).json({ message: 'Ticket already exists.' });
  }

  const newTicket = Ticket.create(value);
  await newTicket.save();

  return res.status(201).json(newTicket);
};

export const updateTicket = async (req: Request, res: Response) => {
  const { ticket_id } = req.params;
  const { is_checked_in, raffle_entries, raffle_wins } = req.body;

  const ticket = await Ticket.findOneBy({
    id: parseInt(ticket_id),
  });

  if (!ticket) {
    return res.status(404).json({ message: 'Invalid ticket ID.' });
  }

  // TODO(jan): Do we want to throw an error when meetup_id or user_id is found in req.body?
  ticket.is_checked_in = is_checked_in ?? ticket.is_checked_in;
  ticket.raffle_entries = raffle_entries ?? ticket.raffle_entries;
  ticket.raffle_wins = raffle_wins ?? ticket.raffle_wins;

  const { error, value } = validateTicket(ticket);

  if (error) {
    return res.status(400).json(error.details);
  }

  await ticket.save();

  return res.status(201).json(ticket);
};

export const deleteTicket = async (req: Request, res: Response) => {
  const { ticket_id } = req.params;

  const ticket = await Ticket.findOneBy({
    id: parseInt(ticket_id),
  });

  if (!ticket) {
    return res.status(404).json({ message: 'Invalid ticket ID.' });
  }

  ticket.remove();

  return res.status(204).end();
};

export const getUserTickets = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  const tickets: SimpleTicketInfo[] = await Ticket.find({
    select: ['id', 'meetup_id'],
    where: {
      user_id: parseInt(user_id),
    },
  });

  return res.json(tickets);
};
