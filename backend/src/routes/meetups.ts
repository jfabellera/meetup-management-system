import express, { type RequestHandler } from 'express';
import {
  createMeetup,
  createMeetupFromEventbrite,
  deleteMeetup,
  getAllMeetups,
  getMeetup,
  getMeetupAttendees,
  syncEventbriteAttendees,
  updateMeetup,
} from '../controllers/meetups';
import { rollRaffleWinner } from '../controllers/raffles';
import { createTicket, updateTicketViaWebhook } from '../controllers/tickets';
import { authChecker, Rule } from '../middleware/authChecker';

const router = express.Router();

router.get('/', getAllMeetups as RequestHandler);

router.get('/:meetup_id', getMeetup as RequestHandler);

router.post(
  '/',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  createMeetup as RequestHandler
);

router.post(
  '/eventbrite',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  createMeetupFromEventbrite as RequestHandler
);

router.put(
  '/:meetup_id',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  updateMeetup as RequestHandler
);

router.delete(
  '/:meetup_id',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  deleteMeetup as RequestHandler
);

router.post(
  '/:meetup_id/rsvp',
  authChecker([Rule.ignoreMeetupOrganizer]) as RequestHandler,
  createTicket as RequestHandler
);

router.get(
  '/:meetup_id/attendees',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  getMeetupAttendees as RequestHandler
);

router.post(
  '/:meetup_id/raffle',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  rollRaffleWinner as RequestHandler
);

router.post(
  '/:meetup_id/sync-eventbrite',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  syncEventbriteAttendees as RequestHandler
);

router.post(
  '/:meetup_id/attendee-webhook',
  updateTicketViaWebhook as RequestHandler
);

export default router;
