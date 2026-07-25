import express, { type RequestHandler } from 'express';
import {
  createAccountLink,
  createConnectAccount,
  getConnectStatus,
} from '../controllers/stripe';
import { authChecker, Rule } from '../middleware/authChecker';

const router = express.Router();

router.post(
  '/connect/account',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  createConnectAccount as RequestHandler
);

router.post(
  '/connect/account-link',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  createAccountLink as RequestHandler
);

router.get(
  '/connect/status',
  authChecker([Rule.requireOrganizer]) as RequestHandler,
  getConnectStatus as RequestHandler
);

export default router;
