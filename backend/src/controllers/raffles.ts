import { type Request, type Response } from 'express';
import { MoreThan, Raw } from 'typeorm';
import { type Meetup } from '../entity/Meetup';
import { Ticket } from '../entity/Ticket';
import {
  type RaffleWinnerInfo,
  type RaffleWinnerResponse,
} from '../interfaces/rafflesInterfaces';
import { generateMultipleRandomNumbers } from '../util/math';
import {
  claimRaffleWinnerSchema,
  rollRaffleWinnerSchema,
} from '../util/validator';

export const rollRaffleWinner = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const meetup = res.locals.meetup as Meetup;
  const result = rollRaffleWinnerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(result.error);
  }

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
      ...(!result.data.allIn
        ? {
            raffle_entries: MoreThan(0),
            raffle_wins: Raw((wins) => `${wins} < raffle_entries`),
          }
        : null),
    },
    select: {
      id: true,
      ticket_holder_display_name: true,
      ticket_holder_first_name: true,
      ticket_holder_last_name: true,
      raffle_wins: true,
    },
  });

  if (tickets.length > 0) {
    // Randomize winner
    const winnerIndices = generateMultipleRandomNumbers(
      result.data.quantity,
      0,
      tickets.length - 1
    );

    const winnerTickets: Ticket[] = [];
    winnerIndices.forEach((winnerIndex) => {
      winnerTickets.push(tickets[winnerIndex]);
    });

    const response: RaffleWinnerResponse = {
      winners: winnerTickets.map((winnerTicket) => {
        return {
          ticketId: winnerTicket.id,
          displayName: winnerTicket.ticket_holder_display_name,
          firstName: winnerTicket.ticket_holder_first_name,
          lastName: winnerTicket.ticket_holder_last_name,
          wins: winnerTicket.raffle_wins,
        } satisfies RaffleWinnerInfo;
      }),
    };

    return res.status(200).json(response);
  }

  return res.status(200).json({ winners: [] } satisfies RaffleWinnerResponse);
};

export const claimRaffleWinner = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const ticket = res.locals.ticket as Ticket;
  const result = claimRaffleWinnerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(result.error);
  }

  if (ticket.raffle_entries <= 0) {
    return res
      .status(400)
      .json({ message: 'Ticket does not have any raffle entries.' });
  }

  if (ticket.raffle_wins >= ticket.raffle_entries && !result.data.force) {
    return res
      .status(400)
      .json({ message: 'Ticket is not eligible for any more wins.' });
  }

  ticket.raffle_wins++;
  await ticket.save();

  return res.status(200).end();
};
