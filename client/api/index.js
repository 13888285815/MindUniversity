// Vercel Serverless Function - API Gateway (inside client/api/)
// Handles all /api/* requests through the Express app from server/
const app = require('../../server/app');
const database = require('../../server/config/database');

let isConnected = false;

const connectDB = async () => {
  if (!isConnected) {
    try {
      await database.connectMongoDB();
      isConnected = true;
    } catch (e) {
      console.error('MongoDB connection failed:', e.message);
    }
  }
};

module.exports = async (req, res) => {
  // Set origin header for same-domain requests
  if (!req.headers.origin) {
    req.headers.origin = 'https://yndxw.com';
  }
  await connectDB();
  return app(req, res);
};
