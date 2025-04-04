import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { config } from 'dotenv';

config();

let mongod: MongoMemoryReplSet;

beforeAll(async () => {
  jest.setTimeout(60000); // Increase timeout for replica set initialization

  process.env.JWT_SECRET = 'testing-secret';
  process.env.RATE_LIMIT_WINDOW_MS = '15000';
  process.env.RATE_LIMIT_MAX = '100';
  process.env.NODE_ENV = 'test';
  process.env.COMPANY_USER_ID = new mongoose.Types.ObjectId().toString(); // Add company user ID for tests

  try {
    // Use a MongoDB replica set for transactions support
    mongod = await MongoMemoryReplSet.create({ 
      replSet: { 
        count: 1, // Minimal replica set
        storageEngine: 'wiredTiger' 
      } 
    });
    
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log("Connected to test MongoDB replica set");
  } catch (error) {
    console.error('Error setting up MongoDB for tests:', error);
  }
}, 60000);

afterAll(async () => {
  try {
    if (mongoose.connection.readyState) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.error('Error shutting down test MongoDB:', error);
  }
}, 15000);

afterEach(async () => {
  if (mongoose.connection.readyState && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});