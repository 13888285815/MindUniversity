// Vercel Serverless Function - API Gateway
// Handles all /api/* requests through Express app
const app = require('../server/app');

// Ensure database connections are established
const database = require('../server/config/database');

let isConnected = false;

const connectDB = async () => {
  if (!isConnected) {
    try {
      await database.connectMongoDB();
      isConnected = true;
    } catch (e) {
      console.error('MongoDB connection failed:', e.message);
    }
    // Redis is optional on Vercel (no long-lived connections)
  }
};

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
