import express, { type RequestHandler } from 'express';
import {
  deleteTicket,
  getAllTickets,
  getTicket,
  updateTicket,
} from '../controllers/tickets';
import { authChecker, Rule } from '../middleware/authChecker';

const router = express.Router();

router.get(
  '/',
  authChecker([Rule.requireAdmin]) as RequestHandler,
  getAllTickets as RequestHandler
);
router.get(
  '/:ticket_id',
  authChecker([Rule.overrideMeetupOrganizer]) as RequestHandler,
  getTicket as RequestHandler
);
router.put(
  '/:ticket_id',
  authChecker() as RequestHandler,
  updateTicket as RequestHandler
);
router.delete(
  '/:ticket_id',
  authChecker() as RequestHandler,
  deleteTicket as RequestHandler
);

export default router;
