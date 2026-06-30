import express from 'express';
import {
  getAllChats,
  getAllUsersByCategory,
  changeUserRole,
  deleteUser,
  getAllGroups,
  deleteGroup,
  deleteMessage
} from '../controllers/superAdminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/superadmin/chats', getAllChats);
router.get('/superadmin/users', getAllUsersByCategory);
router.put('/superadmin/users/:userId/role', changeUserRole);
router.delete('/superadmin/users/:userId', deleteUser);
router.get('/superadmin/groups', getAllGroups);
router.delete('/superadmin/groups/:groupId', deleteGroup);
router.delete('/superadmin/messages/:messageId', deleteMessage);

export default router;
