const { createApp } = require('../server/dist/app');
const { connectDatabase } = require('../server/dist/config/db');
const { env } = require('../server/dist/config/env');

const app = createApp();
let dbPromise = null;

module.exports = async (req, res) => {
  if (env.MONGODB_URI && !dbPromise) {
    dbPromise = connectDatabase(env.MONGODB_URI).catch((err) => {
      console.error('MongoDB connection error in Vercel function:', err);
      dbPromise = null;
    });
  }

  if (dbPromise) {
    try {
      await dbPromise;
    } catch {
      // Continue even if DB failed, route handlers will report error
    }
  }

  return app(req, res);
};
