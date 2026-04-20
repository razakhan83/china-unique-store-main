import 'server-only';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.__mongooseConnection;
const isDev = process.env.NODE_ENV !== 'production';

if (!cached) {
  cached = global.__mongooseConnection = { conn: null, promise: null };
}

const connectionOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 45000,
};

async function createConnection() {
  return mongoose.connect(MONGODB_URI, connectionOptions)
    .then((mongooseInstance) => {
      if (isDev) {
        console.log('[DB] MongoDB connected successfully');
      }
      return mongooseInstance;
    })
    .catch((err) => {
      console.error('[DB] MongoDB connection error:', err.message);
      cached.promise = null;
      throw err;
    });
}

async function mongooseConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return cached.conn;
  }

  if (mongoose.connection.readyState === 2 && cached.promise) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  if (mongoose.connection.readyState === 0) {
    cached.promise = null;
    cached.conn = null;
  }

  if (!cached.promise) {
    cached.promise = createConnection();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;

    // Atlas/server selection can be briefly flaky in local dev, so retry once
    // after clearing any half-open state before surfacing the failure.
    try {
      await mongoose.disconnect().catch(() => {});
      cached.promise = createConnection();
      cached.conn = await cached.promise;
    } catch (retryError) {
      cached.promise = null;
      cached.conn = null;
      throw retryError;
    }
  }

  return cached.conn;
}

export default mongooseConnect;
