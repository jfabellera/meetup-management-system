import express, { type RequestHandler } from 'express';
import {
  getRaffleRecord,
  markRaffleRecordAsDisplayed,
  unclaimRaffleWinner,
} from '../controllers/raffles';
import { authChecker } from '../middleware/authChecker';

const router = express.Router();

router.get(
  '/:raffle_id',
  authChecker() as RequestHandler,
  getRaffleRecord as RequestHandler
);

router.post(
  '/:raffle_id/displayed',
  authChecker() as RequestHandler,
  markRaffleRecordAsDisplayed as RequestHandler
);

router.post(
  '/:raffle_id/unclaim',
  authChecker() as RequestHandler,
  unclaimRaffleWinner as RequestHandler
);

export default router;
