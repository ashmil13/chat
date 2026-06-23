import Message from '../models/message.js';
import User from '../models/user.js';

// @desc    Get all chat transcripts across the system
// @route   GET /api/superadmin/chats
// @access  Private (SuperAdmin only)
export const getAllChats = async (req, res, next) => {
  try {
    // Authorization Check
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, error: 'Access denied: SuperAdmin role required' });
    }

    const messages = await Message.find({})
      .populate('sender', 'name email role profileImage')
      .populate('receiver', 'name email role profileImage')
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
    // Authorization Check
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, error: 'Access denied: SuperAdmin role required' });
    }

    const users = await User.find({}).select('name email role profileImage createdAt');

    // Group users by category
    const groupedUsers = {
      SuperAdmin: [],
      Admin: [],
      User: []
    };

    users.forEach(user => {
      if (groupedUsers[user.role]) {
        groupedUsers[user.role].push(user);
      } else {
        // Fallback for custom roles or safety
        groupedUsers['User'].push(user);
      }
    });

    res.status(200).json({ success: true, groupedUsers, totalUsers: users.length });
  } catch (error) {
    next(error);
  }
};
