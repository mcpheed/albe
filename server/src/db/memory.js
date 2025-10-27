const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

async function connectDB() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB || 'albe';

  if (uri) {
    await mongoose.connect(uri, { dbName });
    console.log('[DB] Connected to MongoDB Atlas');
  } else {
    // Pin a Debian 12+ compatible MongoDB version (>=7.0.3).
    const version = process.env.MONGOMS_VERSION || '7.0.14';
    mongod = await MongoMemoryServer.create({
      binary: { version },                   // <-- key line
      instance: { storageEngine: 'ephemeralForTest' }
    });
    const memUri = mongod.getUri();
    await mongoose.connect(memUri, { dbName });
    console.log(`[DB] Connected to in-memory MongoDB (mongod ${version})`);
  }

  mongoose.connection.on('error', err => console.error('[DB] error', err));
}

async function disconnectDB() {
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
}

module.exports = { connectDB, disconnectDB };

