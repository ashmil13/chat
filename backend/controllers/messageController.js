import Message from '../models/message.js';
import Connection from '../models/connection.js';
import Group from '../models/group.js';

// @desc    Send a message to a user or a group
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, groupId, text } = req.body;
    const senderId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide message text' });
    }

    if (groupId) {
      // Group message logic
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ success: false, error: 'Group not found' });
      }

      // Check membership
      const isMember = group.members.some(memberId => memberId.toString() === senderId.toString());
      if (!isMember) {
        return res.status(403).json({ success: false, error: 'You are not a member of this group' });
      }

      const message = await Message.create({
        sender: senderId,
        group: groupId,
        text: text.trim()
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name email profileImage role');

      return res.status(201).json({ success: true, message: populatedMessage });
    } else if (receiverId) {
      // P2P message logic
      const connection = await Connection.findOne({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId }
        ],
        status: 'accepted'
      });

      if (!connection) {
        return res.status(400).json({ success: false, error: 'You can only message users you are connected with' });
      }

      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text: text.trim()
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name email profileImage role');

      return res.status(201).json({ success: true, message: populatedMessage });
    } else {
      return res.status(400).json({ success: false, error: 'Please provide receiverId or groupId' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat history with a user
// @route   GET /api/messages/:userId
// @access  Private
export const getChatHistory = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    // Verify they are connected (accepted status)
    const connection = await Connection.findOne({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ],
      status: 'accepted'
    });

    if (!connection) {
      return res.status(400).json({ success: false, error: 'You can only view chat history with connected users' });
    }

    // Mark messages sent by otherUserId to currentUserId as read
    await Message.updateMany(
      { sender: otherUserId, receiver: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    }).populate('sender', 'name email profileImage role').sort({ createdAt: 1 }); // Chronological order

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Get group chat history
// @route   GET /api/messages/group/:groupId
// @access  Private
export const getGroupChatHistory = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const groupId = req.params.groupId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    // Check membership
    const isMember = group.members.some(memberId => memberId.toString() === currentUserId.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'You are not a member of this group' });
    }

    const messages = await Message.find({ group: groupId })
      .populate('sender', 'name email profileImage role')
      .sort({ createdAt: 1 }); // Chronological order

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};
