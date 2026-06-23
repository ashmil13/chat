import Message from '../models/message.js';
import Connection from '../models/connection.js';

// @desc    Send a message to a user
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !text) {
      return res.status(400).json({ success: false, error: 'Please provide receiverId and text' });
    }

    // Verify they are connected (accepted status)
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
      text
    });

    res.status(201).json({ success: true, message });
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
    }).sort({ createdAt: 1 }); // Chronological order

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};
