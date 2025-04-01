import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();
const healthController = new HealthController();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: API health check endpoint
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check API health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uptime:
 *                   type: number
 *                   description: The server uptime in seconds
 *                 message:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: number
 *                   description: Current timestamp
 *                 database:
 *                   type: object
 *                   properties:
 *                     state:
 *                       type: string
 *                       enum: [connected, disconnected]
 *                       description: MongoDB connection state
 */
router.get('/', healthController.check);

export { router as healthRoutes };