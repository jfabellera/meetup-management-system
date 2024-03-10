import express, { type RequestHandler } from 'express';
import { eventbriteRedirect } from '../controllers/oauth2';
import { authChecker, Rule } from '../middleware/authChecker';

const router = express.Router();

router.post(
  '/eventbrite',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  eventbriteRedirect as RequestHandler
);

export default router;
