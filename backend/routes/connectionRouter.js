import express from 'express';
import {
  getUsersList,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnections
} from '../controllers/connectionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/connections/users', getUsersList);
router.post('/connections/request', sendConnectionRequest);
router.post('/connections/accept', acceptConnectionRequest);
router.post('/connections/reject', rejectConnectionRequest);
router.get('/connections', getConnections);

export default router;
