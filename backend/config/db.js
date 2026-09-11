const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

let isMock = false;

function sanitizeMongoUri(uri) {
  if (!uri) return uri;
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/);
  if (match) {
    const [, prefix, user, pwd, hostPart] = match;
    const encodedUser = user.includes('%') ? user : encodeURIComponent(user);
    const encodedPwd = pwd.includes('%') ? pwd : encodeURIComponent(pwd);
    return `${prefix}${encodedUser}:${encodedPwd}@${hostPart}`;
  }
  return uri;
}

async function connectDB() {
  const rawUri = process.env.MONGODB_URI;
  const dbName = process.env.DATABASE_NAME || 'geosentinel';

  if (!rawUri) {
    console.log('ℹ️ No MONGODB_URI configured. Running with high-performance in-memory store.');
    isMock = true;
    return { isMock, connection: null };
  }

  const cleanUri = sanitizeMongoUri(rawUri);

  try {
    console.log('🔄 Connecting to MongoDB Atlas cluster...');
    
    // Hard 3-second timeout promise wrapper
    const connectPromise = mongoose.connect(cleanUri, {
      dbName: dbName,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('MongoDB connection timeout (3s)')), 3500)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    isMock = false;
    console.log('✅ Successfully connected to live MongoDB Atlas Cluster!');
  } catch (err) {
    console.warn(`⚠️ MongoDB note (${err.message}). Running with high-resilience in-memory store for offline/edge operation.`);
    isMock = true;
  }

  return { isMock, connection: mongoose.connection };
}

function getIsMock() {
  return isMock;
}

module.exports = {
  connectDB,
  getIsMock,
  mongoose
};
