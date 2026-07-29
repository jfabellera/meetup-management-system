import express, { type RequestHandler } from 'express';
import { claimRaffleWinner } from '../controllers/raffles';
import {
  checkInTicket,
  deleteTicket,
  getAllTickets,
  getTicket,
  getTicketStatus,
  updateTicket,
} from '../controllers/tickets';
import { refundTicket } from '../controllers/ticketPayments';
import { authChecker, Rule } from '../middleware/authChecker';

const router = express.Router();

router.get(
  '/',
  authChecker([Rule.requireAdmin]) as RequestHandler,
  getAllTickets as RequestHandler
);

router.get('/:ticket_id/status', getTicketStatus as RequestHandler);

router.get(
  '/:ticket_id',
  authChecker([Rule.overrideMeetupOrganizer]) as RequestHandler,
  getTicket as RequestHandler
);

router.put(
  '/:ticket_id',
  authChecker([Rule.overrideMeetupOrganizer]) as RequestHandler,
  updateTicket as RequestHandler
);

router.delete(
  '/:ticket_id',
  authChecker() as RequestHandler,
  deleteTicket as RequestHandler
);

router.post(
  '/:ticket_id/checkin',
  authChecker([
    Rule.requireOrganizer,
    Rule.overrideMeetupOrganizer,
  ]) as RequestHandler,
  checkInTicket as RequestHandler
);

router.post(
  '/:ticket_id/refund',
  authChecker([
    Rule.requireOrganizer,
    Rule.overrideMeetupOrganizer,
  ]) as RequestHandler,
  refundTicket as RequestHandler
);

router.post(
  '/:ticket_id/claim',
  authChecker([
    Rule.requireOrganizer,
    Rule.overrideMeetupOrganizer,
  ]) as RequestHandler,
  claimRaffleWinner as RequestHandler
);

export default router;
