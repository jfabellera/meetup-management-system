import express, { type RequestHandler } from 'express';
import { getUserTickets } from '../controllers/tickets';
import { getAllUsers, getUser } from '../controllers/users';
import { authChecker, Rule } from '../middleware/authChecker';

const router = express.Router();

router.get(
  '/',
  authChecker([Rule.requireAdmin]) as RequestHandler,
  getAllUsers as RequestHandler
);
router.get(
  '/:user_id',
  authChecker([Rule.overrideAdmin]) as RequestHandler,
  getUser as RequestHandler
);
router.get(
  '/:user_id/tickets',
  authChecker() as RequestHandler,
  getUserTickets as RequestHandler
);

export default router;
