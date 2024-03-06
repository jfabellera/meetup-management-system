import { type Request, type Response } from 'express';
import { MoreThan, Raw } from 'typeorm';
import { type Meetup } from '../entity/Meetup';
import { Ticket } from '../entity/Ticket';
import { type RaffleWinnerResponse } from '../interfaces/rafflesInterfaces';
import { generateRandomNumber } from '../util/math';

export const rollRaffleWinner = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const meetup = res.locals.meetup as Meetup;

  // Get checked in tickets with raffle entries
  const tickets = await Ticket.find({
    relations: {
      user: true,
    },
    where: {
      meetup: {
        id: meetup.id,
      },
      is_checked_in: true,
      raffle_entries: MoreThan(1),
      raffle_wins: Raw((wins) => `${wins} < raffle_entries`),
    },
    select: {
      id: true,
      user: {
        nick_name: true,
      },
    },
  });

  if (tickets.length > 0) {
    // Randomize winner
    const winnerIndex = generateRandomNumber(0, tickets.length - 1);
    const winnerTicket = tickets[winnerIndex];
    const response: RaffleWinnerResponse = {
      ticketId: winnerTicket.id,
      displayName: winnerTicket.user.nick_name,
    };

    return res.status(200).json(response);
  }

  return res.status(200).end();
};

export const claimRaffleWinner = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const ticket = res.locals.ticket as Ticket;

  if (ticket.raffle_entries <= 0) {
    return res
      .status(400)
      .json({ message: 'Ticket does not have any raffle entries.' });
  }

  if (ticket.raffle_wins >= ticket.raffle_entries) {
    return res
      .status(400)
      .json({ message: 'Ticket is not eligible for any more wins.' });
  }

  ticket.raffle_wins++;
  await ticket.save();

  return res.status(200).end();
};
