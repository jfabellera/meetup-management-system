import express from 'express'
import { getAllMeetups, getMeetup, createMeetup, updateMeetup, deleteMeetup } from '../controllers/meetups'

const router = express.Router();

router.get('/', getAllMeetups);
router.get('/:meetup_id', getMeetup);
router.post('/', createMeetup);
router.put('/:meetup_id', updateMeetup);
router.delete('/:meetup_id', deleteMeetup);

export default router;
