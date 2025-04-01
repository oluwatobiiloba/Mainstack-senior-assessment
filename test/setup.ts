import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { config } from 'dotenv';

config();

let mongod: MongoMemoryReplSet;

beforeAll(async () => {
  jest.setTimeout(30000);

  process.env.JWT_SECRET = 'testing-secret';
  process.env.RATE_LIMIT_WINDOW_MS = '15000';
  process.env.RATE_LIMIT_MAX = '100';
  process.env.NODE_ENV = 'test';

  try {
    mongod = await MongoMemoryReplSet.create({ replSet: { count: 4 } });
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  } catch (error) {
    console.error('Error setting up MongoMemoryReplSet:', error);
  }
}, 10000);

// afterAll(async () => {
//   try {
//     if (mongoose.connection.readyState) {
//       await mongoose.connection.dropDatabase();
//       await mongoose.disconnect();
//     }
//     if (mongod) {
//       await mongod.stop();
//     }
//   } catch (error) {
//     console.error('Error shutting down MongoMemoryReplSet:', error);
//   }
// }, 10000);

afterEach(async () => {
  if (mongoose.connection.readyState && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});