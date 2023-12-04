import express from 'express';
import {
  getAllTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
} from '../controllers/tickets';
import { authChecker, Rule } from '../middleware/authChecker';

const router = express.Router();

router.get('/', authChecker([Rule.requireAdmin]), getAllTickets);
router.get(
  '/:ticket_id',
  authChecker([Rule.overrideMeetupOrganizer]),
  getTicket,
);
router.put('/:ticket_id', authChecker(), updateTicket);
router.delete('/:ticket_id', authChecker(), deleteTicket);

export default router;
