import express, { type RequestHandler } from 'express';
import { eventbriteRedirect } from '../controllers/oauth2';

const router = express.Router();

router.get('/eventbrite', eventbriteRedirect as RequestHandler);

export default router;
