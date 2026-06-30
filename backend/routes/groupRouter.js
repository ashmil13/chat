import express from 'express';
import {
  createGroup,
  getGroups,
  updateGroupName,
  makeGroupAdmin
} from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/groups', createGroup);
router.get('/groups', getGroups);
router.put('/groups/:id', updateGroupName);
router.post('/groups/:id/admins', makeGroupAdmin);

export default router;
