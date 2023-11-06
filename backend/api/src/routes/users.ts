import express from 'express';
import { getAllUsers, getUser } from '../controllers/users';
import { authChecker, Rule } from '../middleware/authChecker';

const router = express.Router();

router.get('/', authChecker([Rule.requireAdmin]), getAllUsers);
router.get('/:user_id', authChecker([Rule.overrideAdmin]), getUser);

export default router;
