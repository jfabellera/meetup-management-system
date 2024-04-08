import { type Request, type Response } from 'express';
import { MoreThan, Raw } from 'typeorm';
import { type Meetup } from '../entity/Meetup';
import { RaffleRecord } from '../entity/RaffleRecord';
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

    // Create raffle record
    const raffleRecord = RaffleRecord.create({
      meetup,
      is_batch_roll: result.data.quantity > 1,
      winners: winnerTickets.map((winnerTicket) => winnerTicket.id),
    });

    await raffleRecord.save();

    const response: RaffleWinnerResponse = {
      raffleRecordId: Number(raffleRecord.id), // TODO(jan): Shouldn't have to cast here
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

  return res.status(200).end();
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

  const raffleRecord = await RaffleRecord.findOne({
    where: {
      id: result.data.raffleRecordId,
    },
  });

  if (raffleRecord == null)
    return res.status(404).json({ message: 'Raffle record not found.' });

  if (!raffleRecord.winners.includes(ticket.id))
    return res
      .status(400)
      .json({ message: 'Ticket is not part of raffle record.' });

  if (raffleRecord.winners_claimed.includes(ticket.id))
    return res.status(400).json({
      message: 'Ticket has already been claimed for the given raffle record.',
    });

  raffleRecord.winners_claimed.push(ticket.id);
  await raffleRecord.save();

  ticket.raffle_wins++;
  await ticket.save();

  return res.status(200).end();
};

export const getRaffleRecords = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const meetup = res.locals.meetup as Meetup;

  const raffleRecords = await RaffleRecord.find({
    where: {
      meetup: {
        id: meetup.id,
      },
    },
  });

  return res.status(200).json(raffleRecords);
};

export const getRaffleRecord = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { raffle_id } = req.params;

  const raffleRecord = await RaffleRecord.findOne({
    where: {
      id: Number(raffle_id),
    },
  });

  return res.status(200).json(raffleRecord);
};
