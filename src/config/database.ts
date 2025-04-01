import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { Transaction } from '../models/transaction.model';
import { AuditLog } from '../models/audit-log.model';
import { CurrencyRate } from '../models/rates.model';
import { UserAccount } from '../models/user-account.model';
import { User } from '../models/user.model';
import { Wallet } from '../models/wallets.model';

export async function connectDatabase(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected successfully');


    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
}