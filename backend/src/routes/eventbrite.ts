import express, { type RequestHandler } from 'express';
import {
  getEventbriteEvents,
  getEventbriteOrganizations,
  getEventbriteQuestions,
} from '../controllers/eventbrite';
import { authChecker, Rule } from '../middleware/authChecker';

const router = express.Router();

router.get(
  '/organizations',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  getEventbriteOrganizations as RequestHandler
);

router.get(
  '/organizations/:organization_id/events',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  getEventbriteEvents as RequestHandler
);

router.get(
  '/events/:event_id/questions',
  authChecker([Rule.overrideOrganizer]) as RequestHandler,
  getEventbriteQuestions as RequestHandler
);

export default router;
