import express from 'express';
import { getUserTickets } from '../controllers/tickets';
import { getAllUsers, getUser } from '../controllers/users';
import { authChecker, Rule } from '../middleware/authChecker';

const router = express.Router();

router.get('/', authChecker([Rule.requireAdmin]), getAllUsers);
router.get('/:user_id', authChecker([Rule.overrideAdmin]), getUser);
router.get('/:user_id/tickets', authChecker([]), getUserTickets);

export default router;
