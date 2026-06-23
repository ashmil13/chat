import express from 'express';
import {
  sendMessage,
  getChatHistory
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/messages', sendMessage);
router.get('/messages/:userId', getChatHistory);

export default router;
