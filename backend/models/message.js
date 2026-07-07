import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  text: {
    type: String,
    required: false,
    default: ''
  },
  fileUrl: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    enum: ['', 'image', 'audio', 'document'],
    default: ''
  },
  fileName: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const Message = mongoose.model('Message', MessageSchema);
export default Message;
