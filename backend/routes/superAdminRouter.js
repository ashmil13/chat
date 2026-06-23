import express from 'express';
import {
  getAllChats,
  getAllUsersByCategory
} from '../controllers/superAdminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/superadmin/chats', getAllChats);
router.get('/superadmin/users', getAllUsersByCategory);

export default router;
