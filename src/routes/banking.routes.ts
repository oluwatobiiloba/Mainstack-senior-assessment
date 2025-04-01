import { Router } from 'express';
import { BankingController } from '../controllers/banking.controller';
import { actionGuard, authGuard, depositWebhookToken } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { Role } from '../interfaces/role.interface';

const router = Router();
const bankingController = new BankingController();


/**
 * @swagger
 * /api/v1/banking/deposit:
 *   post:
 *     summary: Deposit funds to account
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - sourceAccountNumber
 *               - transactionRef
 *               - sourceBank
 *               - destinationAcctNumber
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to deposit
 *               currency:
 *                 type: string
 *                 description: Currency code
 *               sourceAccountNumber:
 *                 type: string
 *                 description: Source account number
 *               transactionRef:
 *                 type: string
 *                 description: Transaction reference
 *               sourceBank:
 *                 type: string
 *                 description: Source bank name/code
 *               destinationAcctNumber:
 *                 type: string
 *                 description: Destination account number
 *     responses:
 *       200:
 *         description: Deposit successful
 *       422:
 *         description: Invalid account
 */
router.post('/deposit', depositWebhookToken(), bankingController.deposit);


// Apply authentication and audit logging middleware to all routes
router.use(authGuard([Role.ADMIN, Role.USER]));
router.use(auditLog());

/**
 * @swagger
 * tags:
 *   name: Banking
 *   description: Banking operations endpoints
 */

/**
 * @swagger
 * /api/v1/banking/withdraw:
 *   post:
 *     summary: Withdraw funds from wallet
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - pin
 *               - currency
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to withdraw
 *               pin:
 *                 type: string
 *                 description: Transaction PIN
 *               currency:
 *                 type: string
 *                 description: Currency code (e.g., NGN, USD)
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       403:
 *         description: Invalid amount
 *       422:
 *         description: Missing parameters or wallet not found
 */
router.post('/withdraw', actionGuard('create', 'banking'), bankingController.withdraw);

/**
 * @swagger
 * /api/v1/banking/transfer:
 *   post:
 *     summary: Transfer funds to another account
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currency
 *               - isInternal
 *               - destinationAcctNumber
 *               - amount
 *             properties:
 *               currency:
 *                 type: string
 *                 description: Currency code
 *               isInternal:
 *                 type: boolean
 *                 description: Whether transfer is internal or external
 *               destinationAcctNumber:
 *                 type: string
 *                 description: Destination account number
 *               amount:
 *                 type: number
 *                 description: Amount to transfer
 *               destinationBank:
 *                 type: string
 *                 description: Destination bank (required for external transfers)
 *     responses:
 *       200:
 *         description: Transfer successful
 *       422:
 *         description: Invalid account or wallet not found
 */
router.post('/transfer', actionGuard('create', 'banking'), bankingController.transfer);

/**
 * @swagger
 * /api/v1/banking/transaction-history:
 *   get:
 *     summary: Get transaction history for a wallet
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         required: true
 *         description: Currency code
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *       422:
 *         description: User or wallet not found
 */
router.get('/transaction-history', actionGuard('read', 'banking'), bankingController.getTransactionHistory);

/**
 * @swagger
 * /api/v1/banking/balance:
 *   get:
 *     summary: Get account balance
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         required: true
 *         description: Currency code
 *     responses:
 *       200:
 *         description: Account balance retrieved successfully
 *       422:
 *         description: User or wallet not found
 */
router.get('/balance', actionGuard('read', 'banking'), bankingController.getAccountBalance);

/**
 * @swagger
 * /api/v1/banking/convert:
 *   post:
 *     summary: Convert currency
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currency
 *               - amount
 *               - targetCurrency
 *             properties:
 *               currency:
 *                 type: string
 *                 description: Source currency code
 *               amount:
 *                 type: number
 *                 description: Amount to convert
 *               targetCurrency:
 *                 type: string
 *                 description: Target currency code
 *     responses:
 *       200:
 *         description: Currency conversion successful
 *       422:
 *         description: User or wallet not found
 */
router.post('/convert', actionGuard('create', 'banking'), bankingController.convert);

export default router;