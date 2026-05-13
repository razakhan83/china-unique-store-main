import 'server-only';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.__mongooseConnection;
const isDev = process.env.NODE_ENV !== 'production';
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
const isServerlessLike =
  process.env.VERCEL === '1' ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
  Boolean(process.env.LAMBDA_TASK_ROOT);
const useFastRuntimeTimeouts = isServerlessLike && !isBuildPhase;

if (!cached) {
  cached = global.__mongooseConnection = { conn: null, promise: null };
}

const connectionOptions = {
  bufferCommands: false,
  // Keep one shared pool size that is stable for local dev, builds, and deploys.
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: isServerlessLike ? 15000 : 30000,
  serverSelectionTimeoutMS: useFastRuntimeTimeouts ? 5000 : 15000,
  connectTimeoutMS: useFastRuntimeTimeouts ? 5000 : 15000,
  socketTimeoutMS: 30000,
};

async function createConnection() {
  const startedAt = Date.now();

  return mongoose.connect(MONGODB_URI, connectionOptions)
    .then((mongooseInstance) => {
      if (isDev) {
        console.log(`[DB] MongoDB connected in ${Date.now() - startedAt}ms`);
      }
      return mongooseInstance;
    })
    .catch((err) => {
      console.error(`[DB] MongoDB connection error after ${Date.now() - startedAt}ms:`, err.message);
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
    cached.conn = null;

    // Keep the local workflow resilient, but fail fast in production so
    // a bad connection moment does not double the user-visible wait time.
    if (!isDev && !isBuildPhase) {
      throw e;
    }

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
