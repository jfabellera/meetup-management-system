import express, { type RequestHandler } from 'express';
import {
  getRaffleRecord,
  markRaffleRecordAsDisplayed,
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

export default router;
