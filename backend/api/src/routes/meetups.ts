import express from 'express'
import { getAllMeetups, getMeetup, createMeetup, updateMeetup, deleteMeetup } from '../controllers/meetups'
import { createTicket } from '../controllers/tickets';
import { authChecker, Rule } from '../middleware/authChecker';

const router = express.Router();

router.get('/', getAllMeetups);
router.get('/:meetup_id', getMeetup);
router.post('/', authChecker([Rule.requireOrganizer]), createMeetup);
router.put('/:meetup_id', authChecker([Rule.requireOrganizer]), updateMeetup);
router.delete('/:meetup_id', authChecker([Rule.requireOrganizer]), deleteMeetup);
router.post('/:meetup_id/rsvp', authChecker(), createTicket);

export default router;
