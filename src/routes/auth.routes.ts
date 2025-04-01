import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Account authentication endpoints
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, CLERK]
 *     responses:
 *       201:
 *         description: Account registered successfully
 *       409:
 *         description: Email already exists
 *       400:
 *         description: Validation error
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 account:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 */
router.post('/login', authController.login);

export { router as authRoutes };