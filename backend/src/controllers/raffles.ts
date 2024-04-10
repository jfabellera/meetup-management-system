import { type Request, type Response } from 'express';
import { MoreThan, Raw } from 'typeorm';
import { type Meetup } from '../entity/Meetup';
import { RaffleRecord } from '../entity/RaffleRecord';
import { RaffleWinner } from '../entity/RaffleWinner';
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
        ticketId: winner.ticket.id,
        displayName: winner.ticket.ticket_holder_display_name,
        firstName: winner.ticket.ticket_holder_first_name,
        lastName: winner.ticket.ticket_holder_last_name,
        wins: winner.ticket.raffle_wins,
      } satisfies RaffleWinnerInfo;
    }),
    winnersClaimed: raffleRecord.winners
      .filter((winner) => winner.claimed)
      .map((winner) => winner.ticket.id),
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

    // Create raffle record
    const raffleRecord = RaffleRecord.create({
      meetup,
      is_batch_roll: result.data.quantity > 1,
    });

    await raffleRecord.save();

    // Create raffle winners for the new raffle record
    const raffleWinners = winnerIndices.map((winnerIndex, index) =>
      RaffleWinner.create({
        raffle_record: raffleRecord,
        ticket: tickets[winnerIndex],
        winner_number: index + 1,
        claimed: false,
      })
    );

    raffleWinners.forEach((raffleWinner) => {
      void (async () => {
        await raffleWinner.save();
      })();
    });

    const response: RaffleWinnerResponse = {
      raffleRecordId: Number(raffleRecord.id), // TODO(jan): Shouldn't have to cast here
      winners: raffleWinners.map((raffleWinner) => {
        return {
          ticketId: raffleWinner.ticket.id,
          displayName: raffleWinner.ticket.ticket_holder_display_name,
          firstName: raffleWinner.ticket.ticket_holder_first_name,
          lastName: raffleWinner.ticket.ticket_holder_last_name,
          wins: raffleWinner.ticket.raffle_wins,
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
    relations: { winners: { ticket: true } },
    where: {
      id: result.data.raffleRecordId,
    },
  });

  if (raffleRecord == null)
    return res.status(404).json({ message: 'Raffle record not found.' });

  const raffleWinner = raffleRecord.winners.find(
    (claimedTicket) => claimedTicket.ticket.id === ticket.id
  );

  if (raffleWinner == null)
    return res
      .status(400)
      .json({ message: 'Ticket is not part of raffle record.' });

  if (raffleWinner.claimed)
    return res.status(400).json({
      message: 'Ticket has already been claimed for the given raffle record.',
    });

  raffleWinner.claimed = true;
  await raffleWinner.save();

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
    relations: { winners: { ticket: true } },
    where: {
      meetup: {
        id: meetup.id,
      },
    },
    order: {
      created_at: 'DESC',
      winners: { winner_number: 'ASC' },
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

export const markRaffleRecordAsDisplayed = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { raffle_id } = req.params;

  const raffleRecord = await RaffleRecord.findOne({
    where: {
      id: Number(raffle_id),
    },
  });

  if (raffleRecord == null)
    return res.status(404).json({ message: 'Invalid raffle record ID.' });

  if (raffleRecord.was_displayed) return res.status(204).end();

  raffleRecord.was_displayed = true;
  await raffleRecord.save();

  return res.status(200).end();
};
