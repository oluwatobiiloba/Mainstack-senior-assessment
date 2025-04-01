import { Wallet, IWallet } from "../models/wallets.model";
import { Transaction, ITransaction, WalletActionEnum } from "../models/transaction.model";
import { HttpException } from "../middleware/error.middleware";
import { logger } from "../utils/logger";
import mongoose, { ClientSession } from "mongoose";
import { v4 as uuid } from 'uuid'
import { WalletService } from "../services/wallet.service";
import { CurrencyService } from "../services/currency.service";
import { ConvertCurrencyDto, DepositFundsDto, GetWalletHistoryDto, ReceiveFundsExternalDto, TransferFundsDto, TransferFundsExternalDto, WithdrawFundsDto } from "@/dtos/transaction.dto";
import { ExternalBankService } from "./external-bank.service";
import { withRetry } from "./utils.services";

export class TransactionService {
  private walletService: WalletService;
  private currencyService: CurrencyService;
  private externalBankService: ExternalBankService;

  constructor() {
    this.walletService = new WalletService();
    this.currencyService = new CurrencyService();
    this.externalBankService = new ExternalBankService();
  }

  async transferFundsInternal(
    transferFundsInput: TransferFundsDto,
    session?: ClientSession
  ): Promise<{ senderWallet: any; receiverWallet: any; ledgerEntry: any }> {
    let newSession = false;
    if (!session) {
      session = await mongoose.startSession();
      session.startTransaction();
      newSession = true;
    }
    try {
      const { senderWalletId, receiverWalletId, amount, currency } = transferFundsInput;
      let ref = transferFundsInput.ref || uuid();

      if (senderWalletId === receiverWalletId)
        throw new HttpException(400, "Cannot transfer to the same wallet");

      const debitResult = await this.walletService.debitWallet({ walletId: senderWalletId, amount, currency, ref }, session);
      const creditResult = await this.walletService.creditWallet({ walletId: receiverWalletId, amount, currency, ref }, session);

      if (newSession) {
        await session.commitTransaction();
        session.endSession();
      }
      return {
        senderWallet: debitResult.wallet,
        receiverWallet: creditResult.wallet,
        ledgerEntry: debitResult.ledgerEntry,
      };
    } catch (error) {
      if (newSession) {
        await session.abortTransaction();
        session.endSession();
      }
      logger.error("Error transferring funds:", error);
      throw error;
    }
  }

  async transferFundsExternal(
    transferFundsInput: TransferFundsExternalDto,
    session?: ClientSession
  ): Promise<{ senderWallet: any; ledgerEntry: any }> {
    let newSession = false;
    if (!session) {
      session = await mongoose.startSession();
      session.startTransaction();
      newSession = true;
    }
    try {
      const { senderWalletId, destinationAccountNumber, destinationBank, amount, currency } = transferFundsInput;
      if (!destinationAccountNumber || !destinationBank)
        throw new HttpException(400, "Provide destination accountNumber and bank");
      if (!amount || amount <= 0)
        throw new HttpException(400, "Provide a valid transfer amount");
      if (!senderWalletId) throw new HttpException(400, "Provide sender’s wallet ID");

      const ref = `ext-${uuid()}-${currency}`;

      // Debit the sender’s wallet.
      const debitResult = await this.walletService.debitWallet({ walletId: senderWalletId, amount, currency, ref }, session);

      // Credit the company's holding wallet.
      const holdingWallet = await this.walletService.getHoldingWallet(currency);
      await this.walletService.creditWallet({ walletId: holdingWallet.id, amount, currency, ref }, session);

      // Process the external transfer (simulate external provider call).
      const transferResult = await this.externalBankService.processTransfer({
        accountNumber: destinationAccountNumber,
        bank: destinationBank,
        amount,
        currency,
        reference: ref,
      });

      if (!transferResult.success) {
        logger.warn(`External transfer failed: ${transferResult.message}`);
        // Refund if external transfer fails.
        await this.walletService.debitWallet({ walletId: holdingWallet.id, amount, currency, ref }, session);
        await this.walletService.creditWallet({ walletId: senderWalletId, amount, currency, ref }, session);
        throw new HttpException(500, "External transfer failed, funds reversed");
      }

      if (newSession) {
        await session.commitTransaction();
        session.endSession();
      }
      return { senderWallet: debitResult.wallet, ledgerEntry: debitResult.ledgerEntry };
    } catch (error) {
      if (newSession) {
        await session.abortTransaction();
        session.endSession();
      }
      logger.error("Error transferring funds:", error);
      throw error;
    }
  }


  async receiveFundsExternal(
    receiveFundsInput: ReceiveFundsExternalDto
  ): Promise<{ receiverWallet: IWallet; transaction: ITransaction }> {
    let session
    try {
      const { receiverWalletId, sourceAccountNumber, sourceBank, amount, currency, recipientAccount, ref } =
        receiveFundsInput;
  
      if (!sourceAccountNumber || !sourceBank) throw new HttpException(400, "Invalid request: source account and bank required.");
      if (!amount || amount <= 0) throw new HttpException(400, "Invalid request: amount must be greater than zero.");
      if (!receiverWalletId) throw new HttpException(400, "Receiver wallet ID is required.");
  
      const existingTransaction = await Transaction.findOne({ reference: ref })
      if (existingTransaction) throw new HttpException(400, "Duplicate transaction reference.");
  
      const transferResult = await this.externalBankService.confirmIncomingTransfer({
        senderAccount: sourceAccountNumber,
        bank: sourceBank,
        amount,
        currency,
        recipientAccount,
        transactionReference: ref,
      });
  
      if (!transferResult.valid) {
        logger.warn(`External incoming transfer failed: ${transferResult.message}`);
        throw new HttpException(500, "Incoming transfer failed, funds not received.");
      }
  
      session = await mongoose.startSession();
      session.startTransaction();
      const creditTransaction = await this.walletService.creditWallet(
        { walletId: receiverWalletId, amount, currency, ref },
        session
      );
  
      await session.commitTransaction();
      return { receiverWallet: creditTransaction.wallet, transaction: creditTransaction.ledgerEntry };
    } catch (error) {
      session && await session.abortTransaction();
      throw error;
    } finally {
      session && session.endSession();
    }
  }
  

  async withdrawFunds(withdrawFundsInput: WithdrawFundsDto, session?: ClientSession): Promise<{ senderWallet: IWallet; transaction: ITransaction }> {
    let newSession = false;
    if (!session) {
      session = await mongoose.startSession();
      session.startTransaction();
      newSession = true;
    }

    try {
      const { amount, currency, sourceWalletId  } = withdrawFundsInput;
      let ref = withdrawFundsInput.ref
      if(!ref) ref = uuid()

      if (!sourceWalletId) throw new HttpException(400, "No source wallet provided");

      //debit customers wallet
      const debitTransaction = await this.walletService.debitWallet({ walletId: sourceWalletId, amount, currency, ref }, session);

      const holdingWallet = await this.walletService.getHoldingWallet(currency);

      //credit holding wallet
      await this.walletService.creditWallet({walletId: holdingWallet.id, amount, currency, ref}, session);


      if (newSession) {
        await session.commitTransaction();
        session.endSession();
      }

      return { senderWallet: debitTransaction.wallet, transaction: debitTransaction.ledgerEntry };
    } catch (error) {
      if (newSession) {
        await session.abortTransaction();
        session.endSession();
      }
      logger.error("Error transferring funds:", error);
      throw error;
    }
  }

  async depositFunds(withdrawFundsInput: DepositFundsDto, session?: ClientSession): Promise<{ senderWallet: IWallet; receiverWallet: IWallet; transaction: ITransaction }> {
    let newSession = false;
    if (!session) {
      session = await mongoose.startSession();
      session.startTransaction();
      newSession = true;
    }

    try {
      const { amount, currency, destinationWalletId  } = withdrawFundsInput;
      let ref = withdrawFundsInput.ref
      if(!ref) ref = uuid()

      if (!destinationWalletId) throw new HttpException(400, "No destination wallet provided");

      const holdingWallet = await this.walletService.getHoldingWallet(currency);
      //debit holding wallet
      const debitTransaction = await this.walletService.debitWallet({ walletId: holdingWallet.id, amount, currency, ref }, session);

      //credit customer wallet
      const creditHolding = await this.walletService.creditWallet({walletId: destinationWalletId, amount, currency, ref}, session);


      if (newSession) {
        await session.commitTransaction();
        session.endSession();
      }

      return { senderWallet: debitTransaction.wallet, receiverWallet: creditHolding.wallet, transaction: debitTransaction.ledgerEntry };
    } catch (error) {
      if (newSession) {
        await session.abortTransaction();
        session.endSession();
      }
      logger.error("Error transferring funds:", error);
      throw error;
    }
  }

  async getWalletHistory(getWalletHistoryDto: GetWalletHistoryDto): Promise<{transactions: ITransaction[], page: number}> {
    const { walletId, limit = 10, page = 1 } = getWalletHistoryDto;
    console.log(page)
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ wallet: walletId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();

    return {transactions, page};
  }

  async getAccountBalance(walletId: string): Promise<{ balance: number; currency: string }> {
    const wallet = await Wallet.findById(walletId);
    if (!wallet) throw new HttpException(404, "Wallet not found");

    return { balance: wallet.balance, currency: wallet.currency };
  }

  async convertCurrency(convertCurrencyInput: ConvertCurrencyDto): Promise<{
    fromWallet: any;
    toWallet: any;
    rate: number;
}> {
    const convertCurrency = await this.currencyService.convertCurrency(convertCurrencyInput);
    return convertCurrency;
  }
}
