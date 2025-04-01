import cluster from 'cluster';
import os from 'os';
import { app } from './app';
import { logger } from './utils/logger';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentVariables } from './dtos/env.dto';
import { connectDatabase } from './config/database';
import * as dotenv from 'dotenv';

dotenv.config();

// Env variable validation
const env = plainToClass(EnvironmentVariables, process.env);
const errors = validateSync(env);
if (errors.length > 0) {
  logger.error('Environment validation failed:', errors);
  process.exit(1);
}

//Clustering to the host machine is properly utilized
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  logger.info(`Primary ${process.pid} is running`);
  logger.info(`Starting ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died. Signal: ${signal}. Code: ${code}`);
    logger.info('Starting a new worker...');
    cluster.fork();
  });
} else {
  const startServer = async () => {
    try {
      await connectDatabase(env.MONGODB_URI);

      const port = env.PORT || 3000;
      app.listen(port, () => {
        logger.info(`Worker ${process.pid} started and listening on port ${port}`);
      });
    } catch (error) {
      logger.error('Server initialization failed:', error);
      process.exit(1);
    }
  };

  startServer();

  //Log server Crashes
  process.on('unhandledRejection', (error: Error) => {
    logger.error('Unhandled Rejection:', error);
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}