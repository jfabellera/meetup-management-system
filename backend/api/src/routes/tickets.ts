import express from 'express'
import { getAllTickets, getTicket, createTicket, updateTicket, deleteTicket } from '../controllers/tickets'

const router = express.Router();

router.get('/', getAllTickets);
router.get('/:id', getTicket);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);

export default router;
