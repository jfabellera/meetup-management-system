import express, { type RequestHandler } from 'express';
import {
  getEventbriteEventsEndpoint,
  getEventbriteOrganizationsEndpoint,
  getEventbriteQuestionsEndpoint,
  getEventbriteTicketsEndpoint,
} from '../controllers/eventbrite';
import { authChecker, Rule } from '../middleware/authChecker';

const router = express.Router();

router.get(
  '/organizations',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  getEventbriteOrganizationsEndpoint as RequestHandler
);

router.get(
  '/organizations/:organization_id/events',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  getEventbriteEventsEndpoint as RequestHandler
);

router.get(
  '/events/:event_id/questions',
  authChecker([Rule.overrideOrganizer]) as RequestHandler,
  getEventbriteQuestionsEndpoint as RequestHandler
);

router.get(
  '/events/:event_id/tickets',
  authChecker([Rule.overrideOrganizer]) as RequestHandler,
  getEventbriteTicketsEndpoint as RequestHandler
);

export default router;
