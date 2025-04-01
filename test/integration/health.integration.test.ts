import request from 'supertest';
import { app } from '../../src/app';
import mongoose from 'mongoose';

describe('Health Check API', () => {
  it('should return 200 and correct structure', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('message', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('database');
    expect(response.body.database).toHaveProperty('state');
  });

  it('should reflect database connection state', async () => {
    const connectedResponse = await request(app).get('/health');
    expect(connectedResponse.body.database.state).toBe('connected');

    const originalConnection = mongoose.connection.readyState;
    // @ts-ignore - Mocking connection state
    mongoose.connection.readyState = 0;

    const disconnectedResponse = await request(app).get('/health');
    expect(disconnectedResponse.body.database.state).toBe('disconnected');

    // @ts-ignore - Restoring connection state
    mongoose.connection.readyState = originalConnection;
  });

  it('should not be rate limited', async () => {
    // Make multiple requests in quick succession
    const requests = Array(150).fill(null).map(() => 
      request(app).get('/health')
    );

    const responses = await Promise.all(requests);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should return quickly', async () => {
    const startTime = Date.now();
    await request(app).get('/health');
    const endTime = Date.now();

    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(100);
  });
});