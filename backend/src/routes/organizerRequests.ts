import express from 'express';
import { authChecker, Rule } from '../middleware/authChecker';
import {
    createOrganizerRequest,
    deleteOrganizerRequest,
    getAllOrganizerRequests
} from '../controllers/organizerRequests';

const router = express.Router();

router.get('/', getAllOrganizerRequests);
router.post('/', createOrganizerRequest);
router.delete(
    '/:organizer_request_id',
    authChecker([Rule.requireAdmin]),
    deleteOrganizerRequest,
);

export default router;
