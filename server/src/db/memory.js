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
    mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    await mongoose.connect(memUri, { dbName });
    console.log('[DB] Connected to in-memory MongoDB');
  }

  mongoose.connection.on('error', err => console.error('[DB] error', err));
}

async function disconnectDB() {
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
}

module.exports = { connectDB, disconnectDB };

