import express, { type RequestHandler } from 'express';
import { getRaffleRecord } from '../controllers/raffles';
import { authChecker } from '../middleware/authChecker';

const router = express.Router();

router.get(
  '/:raffle_id',
  authChecker() as RequestHandler,
  getRaffleRecord as RequestHandler
);

export default router;
