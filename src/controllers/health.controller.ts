import { Request, Response } from 'express';
import mongoose from 'mongoose';

export class HealthController {
  async check(req: Request, res: Response): Promise<void> {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      database: {
        state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      }
    };

    res.status(200).json(healthcheck);
  }
}