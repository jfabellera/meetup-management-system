import { type Request, type Response } from 'express';
import { MoreThan, Raw } from 'typeorm';
import { type Meetup } from '../entity/Meetup';
import { RaffleRecord } from '../entity/RaffleRecord';
import { Ticket } from '../entity/Ticket';
import {
  type RaffleRecordResponse,
  type RaffleWinnerInfo,
  type RaffleWinnerResponse,
} from '../interfaces/rafflesInterfaces';
import { generateMultipleRandomNumbers } from '../util/math';
import {
  claimRaffleWinnerSchema,
  rollRaffleWinnerSchema,
} from '../util/validator';

const mapRaffleRecordToResponse = (
  raffleRecord: RaffleRecord
): RaffleRecordResponse => {
  return {
    id: raffleRecord.id,
    isBatchRoll: raffleRecord.is_batch_roll,
    winners: raffleRecord.winners.map((winner) => {
      return {
        ticketId: winner.id,
        displayName: winner.ticket_holder_display_name,
        firstName: winner.ticket_holder_first_name,
        lastName: winner.ticket_holder_last_name,
        wins: winner.raffle_wins,
      } satisfies RaffleWinnerInfo;
    }),
    winnersClaimed: raffleRecord.winners_claimed.map((claimed) => claimed.id),
    wasDisplayed: raffleRecord.was_displayed,
    createdAt: raffleRecord.created_at,
  } satisfies RaffleRecordResponse;
};

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
      winners: winnerTickets,
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
    relations: ['winners', 'winners_claimed'],
    where: {
      id: result.data.raffleRecordId,
    },
  });

  if (raffleRecord == null)
    return res.status(404).json({ message: 'Raffle record not found.' });

  if (
    raffleRecord.winners.find(
      (winnerTicket) => winnerTicket.id === ticket.id
    ) == null
  )
    return res
      .status(400)
      .json({ message: 'Ticket is not part of raffle record.' });

  if (
    raffleRecord.winners_claimed.find(
      (claimedTicket) => claimedTicket.id === ticket.id
    ) != null
  )
    return res.status(400).json({
      message: 'Ticket has already been claimed for the given raffle record.',
    });

  raffleRecord.winners_claimed.push(ticket);
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
    relations: ['winners', 'winners_claimed'],
    where: {
      meetup: {
        id: meetup.id,
      },
    },
  });

  return res.status(200).json(raffleRecords.map(mapRaffleRecordToResponse));
};

export const getRaffleRecord = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { raffle_id } = req.params;

  const raffleRecord = await RaffleRecord.findOne({
    relations: ['winners', 'winners_claimed'],
    where: {
      id: Number(raffle_id),
    },
  });

  if (raffleRecord == null)
    return res.status(404).json({ message: 'Invalid raffle record ID.' });

  return res.status(200).json(mapRaffleRecordToResponse(raffleRecord));
};
