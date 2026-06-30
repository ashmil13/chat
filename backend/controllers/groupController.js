import Group from '../models/group.js';
import Message from '../models/message.js';
import User from '../models/user.js';

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res, next) => {
  try {
    const { name, members } = req.body;
    const creatorId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide a group name' });
    }

    // Initialize members array with creator
    const groupMembersSet = new Set([creatorId.toString()]);
    if (Array.isArray(members)) {
      members.forEach(memberId => {
        if (memberId) {
          groupMembersSet.add(memberId.toString());
        }
      });
    }

    const groupMembers = Array.from(groupMembersSet);

    const group = await Group.create({
      name: name.trim(),
      creator: creatorId,
      admins: [creatorId],
      members: groupMembers
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email profileImage role')
      .populate('admins', 'name email profileImage role')
      .populate('creator', 'name email profileImage role');

    res.status(201).json({ success: true, group: populatedGroup });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all groups for logged in user
// @route   GET /api/groups
// @access  Private
export const getGroups = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    const groups = await Group.find({ members: currentUserId })
      .populate('members', 'name email profileImage role')
      .populate('admins', 'name email profileImage role')
      .populate('creator', 'name email profileImage role');

    const groupsWithLastMessage = await Promise.all(groups.map(async (group) => {
      const lastMessage = await Message.findOne({ group: group._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'name email profileImage role');

      return {
        _id: group._id,
        name: group.name,
        creator: group.creator,
        admins: group.admins,
        members: group.members,
        isGroup: true,
        lastMessageText: lastMessage ? lastMessage.text : null,
        lastMessageSender: lastMessage ? lastMessage.sender : null,
        lastMessageAt: lastMessage ? lastMessage.createdAt : null
      };
    }));

    res.status(200).json({ success: true, groups: groupsWithLastMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Update group name
// @route   PUT /api/groups/:id
// @access  Private
export const updateGroupName = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const { name } = req.body;
    const currentUserId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide a group name' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    // Verify current user is admin of the group
    const isAdmin = group.admins.some(adminId => adminId.toString() === currentUserId.toString());
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Only group admins can rename the group' });
    }

    group.name = name.trim();
    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email profileImage role')
      .populate('admins', 'name email profileImage role')
      .populate('creator', 'name email profileImage role');

    res.status(200).json({ success: true, group: populatedGroup });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a group admin
// @route   POST /api/groups/:id/admins
// @access  Private
export const makeGroupAdmin = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const { userId } = req.body;
    const currentUserId = req.user.id;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'Please provide userId to promote' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    // Verify current user is admin of the group
    const isCurrentAdmin = group.admins.some(adminId => adminId.toString() === currentUserId.toString());
    if (!isCurrentAdmin) {
      return res.status(403).json({ success: false, error: 'Only group admins can assign other admins' });
    }

    // Verify the target user is a member of the group
    const isMember = group.members.some(memberId => memberId.toString() === userId.toString());
    if (!isMember) {
      return res.status(400).json({ success: false, error: 'User must be a member of the group to be an admin' });
    }

    // Check if target user is already admin
    const isAlreadyAdmin = group.admins.some(adminId => adminId.toString() === userId.toString());
    if (!isAlreadyAdmin) {
      group.admins.push(userId);
      await group.save();
    }

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email profileImage role')
      .populate('admins', 'name email profileImage role')
      .populate('creator', 'name email profileImage role');

    res.status(200).json({ success: true, group: populatedGroup });
  } catch (error) {
    next(error);
  }
};
