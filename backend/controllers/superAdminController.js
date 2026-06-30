import Message from '../models/message.js';
import User from '../models/user.js';
import Group from '../models/group.js';

// @desc    Get all chat transcripts across the system
// @route   GET /api/superadmin/chats
// @access  Private (SuperAdmin only)
export const getAllChats = async (req, res, next) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, error: 'Access denied: SuperAdmin role required' });
    }

    const messages = await Message.find({})
      .populate('sender', 'name email role profileImage')
      .populate('receiver', 'name email role profileImage')
      .populate('group', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users grouped by category/role
// @route   GET /api/superadmin/users
// @access  Private (SuperAdmin only)
export const getAllUsersByCategory = async (req, res, next) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, error: 'Access denied: SuperAdmin role required' });
    }

    const users = await User.find({}).select('name email role profileImage createdAt');

    const groupedUsers = {
      SuperAdmin: [],
      Admin: [],
      User: []
    };

    users.forEach(user => {
      if (groupedUsers[user.role]) {
        groupedUsers[user.role].push(user);
      } else {
        groupedUsers['User'].push(user);
      }
    });

    res.status(200).json({ success: true, groupedUsers, totalUsers: users.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Change a user's role
// @route   PUT /api/superadmin/users/:userId/role
// @access  Private (SuperAdmin only)
export const changeUserRole = async (req, res, next) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, error: 'Access denied: SuperAdmin role required' });
    }
    const { role } = req.body;
    if (!['User', 'Admin', 'SuperAdmin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role specified' });
    }
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot change your own role' });
    }
    user.role = role;
    await user.save();
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user and clean up their messages/groups
// @route   DELETE /api/superadmin/users/:userId
// @access  Private (SuperAdmin only)
export const deleteUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, error: 'Access denied: SuperAdmin role required' });
    }
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
    }
    
    await User.findByIdAndDelete(req.params.userId);

    await Message.deleteMany({
      $or: [
        { sender: req.params.userId },
        { receiver: req.params.userId }
      ]
    });

    await Group.updateMany(
      { members: req.params.userId },
      { $pull: { members: req.params.userId, admins: req.params.userId } }
    );

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all groups across the system
// @route   GET /api/superadmin/groups
// @access  Private (SuperAdmin only)
export const getAllGroups = async (req, res, next) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, error: 'Access denied: SuperAdmin role required' });
    }
    const groups = await Group.find({})
      .populate('creator', 'name email role')
      .populate('members', 'name email role')
      .populate('admins', 'name email role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, groups });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a group
// @route   DELETE /api/superadmin/groups/:groupId
// @access  Private (SuperAdmin only)
export const deleteGroup = async (req, res, next) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, error: 'Access denied: SuperAdmin role required' });
    }
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    await Group.findByIdAndDelete(req.params.groupId);
    await Message.deleteMany({ group: req.params.groupId });
    res.status(200).json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a single message
// @route   DELETE /api/superadmin/messages/:messageId
// @access  Private (SuperAdmin only)
export const deleteMessage = async (req, res, next) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, error: 'Access denied: SuperAdmin role required' });
    }
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    await Message.findByIdAndDelete(req.params.messageId);
    res.status(200).json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};
