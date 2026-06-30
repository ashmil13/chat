import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import userRouter from './routes/userRouter.js';
import connectionRouter from './routes/connectionRouter.js';
import messageRouter from './routes/messageRouter.js';
import superAdminRouter from './routes/superAdminRouter.js';
import groupRouter from './routes/groupRouter.js';

// Load environmental variables
dotenv.config();

// Create Express app
const app = express();

// Connect to Mock Database
connectDB();

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Mount routes
app.use('/api', userRouter);
app.use('/api', connectionRouter);
app.use('/api', messageRouter);
app.use('/api', superAdminRouter);
app.use('/api', groupRouter);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the MVC Backend API',
    endpoints: {
      auth: '/api',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({ success: false, error: message });
  }

  if (err.code === 11000) {
    return res.status(400).json({ success: false, error: 'Database conflict: Unique constraint failed.' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in development mode on port ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/`);
});
