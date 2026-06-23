import mongoose from 'mongoose';
import User from '../models/user.js';

// Connect to MongoDB Database
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chats');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed default SuperAdmin if not exists
    const superAdminEmail = 'ashmil@gmail.com';
    const superAdminExists = await User.findOne({ email: superAdminEmail });
    if (!superAdminExists) {
      await User.create({
        name: 'Ashmil',
        email: superAdminEmail,
        password: '12341234',
        role: 'SuperAdmin',
        profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${superAdminEmail}`
      });
      console.log(`🌱 Default SuperAdmin seeded: ${superAdminEmail}`);
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

