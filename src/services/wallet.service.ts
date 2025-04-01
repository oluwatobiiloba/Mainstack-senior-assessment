import { Wallet, IWallet } from "../models/wallets.model";
import { Transaction, ITransaction, WalletActionEnum } from "../models/transaction.model";
import { HttpException } from "../middleware/error.middleware";
import { AuditableRequest } from "../middleware/audit.middleware";
import { logger } from "../utils/logger";
import mongoose, { ClientSession } from "mongoose";
import { CreditWalletDto, DebitWalletDto } from "@/dtos/wallet.dto";
import { codes } from 'currency-codes';

export class WalletService {
  private COMPANY_ID = process.env.COMPANY_WALLET_ID || "company";
  
  async getWalletById(walletId: string) {
      const wallet = await Wallet.findById(walletId)
      if(!wallet) throw new Error("Wallet not found")
      return wallet
  }

  async getWalletByCurrency(currency: string, userId: string) {
    const wallet = await Wallet.findOne({
      currency,
      user: userId
    })
    if(!wallet) throw new Error("Wallet not found")
    return wallet
}

  async creditWallet(
    creditWalletInput: CreditWalletDto,
    session: ClientSession
  ): Promise<{ ledgerEntry: ITransaction; wallet: IWallet }> {
    try {
      const { walletId, amount, currency, ref } = creditWalletInput;

      // Prevent duplicate ledger entries.
      const existingEntry = await Transaction.findOne({ reference: ref }).session(session);
      if (existingEntry) throw new HttpException(400, "Duplicate transaction reference");

      // Atomically update wallet balance.
      const wallet = await Wallet.findOneAndUpdate(
        { _id: walletId },
        { $inc: { balance: amount } },
        { session, new: true }
      );
      if (!wallet) throw new HttpException(404, "Wallet not found");

      const ledgerEntry = await Transaction.create(
        [
          {
            wallet: wallet._id,
            type: WalletActionEnum.CREDIT,
            amount,
            currency,
            reference: `${ref}-CREDIT`,
          },
        ],
        { session }
      );

      return { ledgerEntry: ledgerEntry[0], wallet };
    } catch (error) {
      logger.error("Error crediting wallet:", error);
      throw error;
    }
  }

  async debitWallet(
    debitWalletInput: DebitWalletDto,
    session: ClientSession
  ): Promise<{ ledgerEntry: ITransaction; wallet: IWallet }> {
    try {
      const { walletId, amount, currency, ref } = debitWalletInput;

      const existingEntry = await Transaction.findOne({ reference: ref }).session(session);
      if (existingEntry) throw new HttpException(400, "Duplicate transaction reference");

      const wallet = await Wallet.findOneAndUpdate(
        { _id: walletId, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { session, new: true }
      );
      if (!wallet) throw new HttpException(400, "Insufficient funds or wallet not found");

      const ledgerEntry = await Transaction.create(
        [
          {
            wallet: wallet._id,
            type: WalletActionEnum.DEBIT,
            amount,
            currency,
            reference: `${ref}-DEBIT`,
          },
        ],
        { session }
      );

      return { ledgerEntry: ledgerEntry[0], wallet };
    } catch (error) {
      logger.error("Error debiting wallet:", error);
      throw error;
    }
  }

  async getHoldingWallet(currency: string): Promise<IWallet> {
    try {
      let holdingWallet = await Wallet.findOne({ currency, user: this.COMPANY_ID });

      if (!holdingWallet) {
        logger.warn(`Holding wallet for ${currency} not found. Creating a new one...`);

        holdingWallet = await Wallet.create({
          currency,
          user: this.COMPANY_ID,
          balance: 0,
        });
      }

      return holdingWallet;
    } catch (error) {
      logger.error("Error fetching company holding wallet:", error);
      throw new HttpException(500, "Internal Server Error");
    }
  }

  async createWallet(currency: string, userId: string){
    return Wallet.create({
      user: userId,
      currency
    })
  }
  async createWalletInAllCurrencies(userId: string){
    const createWalletPromise = codes().map(code => {
      this.createWallet(code,userId)
    })

    return Promise.all(createWalletPromise)
  }
}
