import Connection from '../models/connection.js';
import User from '../models/user.js';
import Message from '../models/message.js';

// @desc    Get all users list with connection status
// @route   GET /api/connections/users
// @access  Private
export const getUsersList = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // Fetch all users except current user
    const users = await User.find({ _id: { $ne: currentUserId } }).select('name email profileImage role lastLogin');

    // Fetch connections involving current user
    const connections = await Connection.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    });

    // Create a status map for quick lookup
    const userStatusMap = {};
    connections.forEach(conn => {
      if (conn.status === 'accepted') {
        const friendId = conn.sender.toString() === currentUserId.toString() ? conn.receiver.toString() : conn.sender.toString();
        userStatusMap[friendId] = { status: 'accepted', connectionId: conn._id };
      } else if (conn.status === 'pending') {
        if (conn.sender.toString() === currentUserId.toString()) {
          userStatusMap[conn.receiver.toString()] = { status: 'pending_sent', connectionId: conn._id };
        } else {
          userStatusMap[conn.sender.toString()] = { status: 'pending_received', connectionId: conn._id };
        }
      }
    });

    const result = users.map(user => {
      const relation = userStatusMap[user._id.toString()] || { status: 'none', connectionId: null };
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        connectionStatus: relation.status,
        connectionId: relation.connectionId
      };
    });

    res.status(200).json({ success: true, users: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a connection request
// @route   POST /api/connections/request
// @access  Private
export const sendConnectionRequest = async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot send a connection request to yourself' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existingConnection) {
      if (existingConnection.status === 'accepted') {
        return res.status(400).json({ success: false, error: 'You are already connected' });
      }
      
      // Mutual request case: if the existing pending request was sent by the receiver,
      // we automatically accept the request and connect them mutually!
      if (existingConnection.status === 'pending' && existingConnection.sender.toString() === receiverId.toString()) {
        existingConnection.status = 'accepted';
        await existingConnection.save();
        return res.status(200).json({ success: true, message: 'Mutual request! Connected successfully', connection: existingConnection });
      }

      return res.status(400).json({ success: false, error: 'Connection request is already pending or processed' });
    }

    const newConnection = await Connection.create({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    res.status(201).json({ success: true, connection: newConnection });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a connection request
// @route   POST /api/connections/accept
// @access  Private
export const acceptConnectionRequest = async (req, res, next) => {
  try {
    const { senderId } = req.body; // sender of the request
    const receiverId = req.user.id; // current logged in user (receiver)

    const connection = await Connection.findOne({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({ success: false, error: 'Pending connection request not found' });
    }

    connection.status = 'accepted';
    await connection.save();

    res.status(200).json({ success: true, connection });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject/Cancel a connection request
// @route   POST /api/connections/reject
// @access  Private
export const rejectConnectionRequest = async (req, res, next) => {
  try {
    const { userId } = req.body; // user on the other side of connection
    const currentUserId = req.user.id;

    // Find and delete the connection so they can request again later
    const connection = await Connection.findOneAndDelete({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    });

    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection record not found' });
    }

    res.status(200).json({ success: true, message: 'Connection removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all connections (accepted and pending)
// @route   GET /api/connections
// @access  Private
export const getConnections = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    const connections = await Connection.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
      status: { $in: ['accepted', 'pending'] }
    }).populate('sender', 'name email profileImage role lastLogin')
      .populate('receiver', 'name email profileImage role lastLogin');

    const friends = await Promise.all(connections.map(async conn => {
      if (!conn.sender || !conn.receiver) return null;
      const isSender = conn.sender._id.toString() === currentUserId.toString();
      const friendUser = isSender ? conn.receiver : conn.sender;

      const unreadCount = await Message.countDocuments({
        sender: friendUser._id,
        receiver: currentUserId,
        isRead: false
      });

      const lastMessage = await Message.findOne({
        $or: [
          { sender: currentUserId, receiver: friendUser._id },
          { sender: friendUser._id, receiver: currentUserId }
        ]
      }).sort({ createdAt: -1 });

      return {
        _id: friendUser._id,
        name: friendUser.name,
        email: friendUser.email,
        profileImage: friendUser.profileImage,
        role: friendUser.role,
        connectionStatus: conn.status === 'accepted' ? 'accepted' : (isSender ? 'pending_sent' : 'pending_received'),
        connectionId: conn._id,
        unreadCount,
        lastMessageText: lastMessage ? lastMessage.text : null,
        lastMessageSender: lastMessage ? lastMessage.sender : null,
        lastMessageAt: lastMessage ? lastMessage.createdAt : null,
        lastLogin: friendUser.lastLogin
      };
    }));
    const validFriends = friends.filter(Boolean);

    res.status(200).json({ success: true, connections: validFriends });
  } catch (error) {
    next(error);
  }
};
