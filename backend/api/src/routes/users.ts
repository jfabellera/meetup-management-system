import express from 'express'
import { getAllUsers, getUser } from '../controllers/users'

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:user_id', getUser);

export default router;
