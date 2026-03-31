import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;
const isDev = process.env.NODE_ENV !== 'production';

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function mongooseConnect() {
  // If we have a cached connection, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If the connection is dropped (readyState 0), reset our cached connection state
  if (mongoose.connection.readyState === 0) {
    cached.promise = null;
    cached.conn = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000,
      family: 4,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        if (isDev) {
          console.log('[DB] MongoDB connected successfully');
        }
        return mongoose;
      })
      .catch((err) => {
        console.error('[DB] MongoDB connection error:', err.message);
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default mongooseConnect;
