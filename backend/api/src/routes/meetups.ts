import express from 'express'
import { getAllMeetups, getMeetup, createMeetup, updateMeetup, deleteMeetup } from '../controllers/meetups'

const router = express.Router();

router.get('/', getAllMeetups);
router.get('/:id', getMeetup);
router.post('/', createMeetup);
router.put('/:id', updateMeetup);
router.delete('/:id', deleteMeetup);

export default router;
