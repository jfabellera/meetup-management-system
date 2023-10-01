import express from 'express'
import { getAllTickets, getTicket, createTicket, updateTicket, deleteTicket } from '../controllers/tickets'

const router = express.Router();

router.get('/', getAllTickets);
router.get('/:ticket_id', getTicket);
router.post('/', createTicket);
router.put('/:ticket_id', updateTicket);
router.delete('/:ticket_id', deleteTicket);

export default router;
