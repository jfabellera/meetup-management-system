import { type Request, type Response } from 'express';
import { MoreThan, Raw } from 'typeorm';
import { type Meetup } from '../entity/Meetup';
import { Ticket } from '../entity/Ticket';
import { type User } from '../entity/User';
import { type RaffleWinnerResponse } from '../interfaces/rafflesInterfaces';
import { getEventbriteAttendee } from '../util/eventbriteApi';
import { generateRandomNumber } from '../util/math';
import { decrypt } from '../util/security';

export const rollRaffleWinner = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const meetup = res.locals.meetup as Meetup;
  const user = res.locals.requestor as User;

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
      raffle_entries: MoreThan(0),
      raffle_wins: Raw((wins) => `${wins} < raffle_entries`),
    },
    select: {
      id: true,
      user: {
        nick_name: true,
      },
      eventbrite_attendee_id: true,
    },
  });

  if (tickets.length > 0) {
    // Randomize winner
    const winnerIndex = generateRandomNumber(0, tickets.length - 1);
    const winnerTicket = tickets[winnerIndex];

    let displayName: string;
    if (
      winnerTicket.eventbrite_attendee_id != null &&
      meetup.eventbriteRecord != null &&
      user.encrypted_eventbrite_token != null
    ) {
      try {
        const attendee = await getEventbriteAttendee(
          decrypt(user.encrypted_eventbrite_token),
          meetup.eventbriteRecord.event_id,
          winnerTicket.eventbrite_attendee_id,
          meetup.eventbriteRecord.display_name_question_id
        );

        displayName =
          attendee?.displayName ?? String(winnerTicket.eventbrite_attendee_id);
      } catch (error: any) {
        return res
          .status(500)
          .json({ message: 'Unable to get Eventbrite details.' });
      }
    } else {
      displayName = winnerTicket.user.nick_name;
    }

    const response: RaffleWinnerResponse = {
      ticketId: winnerTicket.id,
      displayName,
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
