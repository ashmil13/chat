import express from 'express';
import {
  createGroup,
  getGroups,
  updateGroupName,
  makeGroupAdmin,
  removeGroupMember,
  addGroupMembers
} from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/groups', createGroup);
router.get('/groups', getGroups);
router.put('/groups/:id', updateGroupName);
router.post('/groups/:id/admins', makeGroupAdmin);
router.delete('/groups/:id/members/:userId', removeGroupMember);
router.post('/groups/:id/members', addGroupMembers);

export default router;
