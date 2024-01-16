import express from 'express';
import { authChecker, Rule } from '../middleware/authChecker';
import {
    createOrganizerRequest,
    deleteOrganizerRequest,
    getAllOrganizerRequests
} from '../controllers/organizerRequests';

const router = express.Router();

router.get('/', getAllOrganizerRequests);
router.post('/', authChecker([]), createOrganizerRequest);
router.delete(
    '/:request_id',
    authChecker([Rule.overrideAdmin]),
    deleteOrganizerRequest,
);

export default router;
