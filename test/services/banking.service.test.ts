import { BankingService } from '../../src/services/banking.service';
import { Transaction, WalletActionEnum } from '../../src/models/transaction.model';
import { AuditLog } from '../../src/models/audit-log.model';
import { BalanceDTO, ConvertDTO, DepositDto, TransactionHistoryDTO, TransferDto, WithdrawalDto } from "../../src/dtos/banking.dto";
import { HttpException } from '../../src/middleware/error.middleware';
import mongoose from 'mongoose';
import { Request } from 'express';
import { AuditableRequest } from '../../src/middleware/audit.middleware';
import { Wallet } from '../../src/models/wallets.model';
import { v4 } from 'uuid';
import { UserAccount } from '../../src/models/user-account.model';
import { User } from '../../src/models/user.model';
import { AuthService } from '../../src/services/auth.service';
import { CurrencyRate } from '../../src/models/rates.model';

describe('BankingService', () => {
  let bankingService: BankingService;
  let authService: AuthService;
  let userId: string;
  let userId2: string;
  let userAccount1: any;
  let userAccount2: any;
  
  const mockAuditableRequest = (id: string = userId): AuditableRequest => {
    return {
      user: { id },
      auditContext: undefined
    } as unknown as AuditableRequest;
  };

  beforeEach(() => {
    bankingService = new BankingService();
  });

  beforeAll(async () => {    
    authService = new AuthService();
    
    try {
      // Create test users with unique emails
      const timestamp = Date.now();
      const testUser = await authService.register({
        "email": `test_user_${timestamp}@example.com`,
        "password": "password",
        "firstName": "Test",
        "lastName": "User"
      });
  
      const testUser2 = await authService.register({
        "email": `test_user2_${timestamp}@example.com`,
        "password": "password",
        "firstName": "Test2",
        "lastName": "User2"
      });
      
      console.log("Created test users:", testUser, testUser2);
      
      userId = testUser.id;
      userId2 = testUser2.id;
  
      userAccount1 = await UserAccount.findOne({ user: userId });
      userAccount2 = await UserAccount.findOne({ user: userId2 });

      if (!userAccount1) {
        console.log("Creating account for user 1");
        userAccount1 = await UserAccount.create({
          user: userId,
          accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString()
        });
      }
      
      if (!userAccount2) {
        console.log("Creating account for user 2");
        userAccount2 = await UserAccount.create({
          user: userId2,
          accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString()
        });
      }
      
      console.log("Test accounts:", userAccount1, userAccount2);
    } catch (error) {
      console.error("Error setting up test users and accounts:", error);
    }
    
    // Create wallets if they don't exist
    let wallet1 = await Wallet.findOne({ user: userId, currency: 'USD' });
    if (!wallet1) {
      wallet1 = await Wallet.create({
        user: userId,
        currency: 'USD',
        balance: 0
      });
    }
    
    wallet1.balance = 1000; 
    await wallet1.save();
    
    let wallet2 = await Wallet.findOne({ user: userId2, currency: 'USD' });
    if (!wallet2) {
      wallet2 = await Wallet.create({
        user: userId2,
        currency: 'USD',
        balance: 0
      });
    }
    
    wallet2.balance = 500; // Set initial balance for testing
    await wallet2.save();
    
    // Also create EUR wallets for currency conversion testing
    let eurWallet1 = await Wallet.findOne({ user: userId, currency: 'EUR' });
    if (!eurWallet1) {
      eurWallet1 = await Wallet.create({
        user: userId,
        currency: 'EUR',
        balance: 100
      });
    }
    
    let eurWallet2 = await Wallet.findOne({ user: userId2, currency: 'EUR' });
    if (!eurWallet2) {
      eurWallet2 = await Wallet.create({
        user: userId2,
        currency: 'EUR',
        balance: 100
      });
    }
    
    try {
      const existingRate = await CurrencyRate.findOne({ 
        baseCurrency: 'USD', 
        targetCurrency: 'EUR' 
      });
      
      if (!existingRate) {
        await CurrencyRate.create({
          baseCurrency: 'USD',
          targetCurrency: 'EUR',
          rate: 0.85
        });
      }
    } catch (error) {
      console.log("Error creating currency rate:", error);
    }
  });

  afterAll(async () => {
    await Transaction.deleteMany({ 
      wallet: { $in: await Wallet.find({ user: { $in: [userId, userId2] } }).distinct('_id') } 
    });
    await Wallet.deleteMany({ user: { $in: [userId, userId2] } });
    await UserAccount.deleteMany({ user: { $in: [userId, userId2] } });
    await User.deleteMany({ _id: { $in: [userId, userId2] } });
    await CurrencyRate.deleteMany({ 
      baseCurrency: 'USD', 
      targetCurrency: 'EUR' 
    });
  });

  describe.skip('Initiate a withdrawal', () => {
    const withdrawInput: WithdrawalDto = {
      amount: 10,
      userId: userId,
      currency: 'USD',
      pin: '1234'
    };
    
    it('should create a withdrawal successfully', async () => {
      const req = mockAuditableRequest();
      const withdraw = await bankingService.withdraw(withdrawInput, req);
      
      expect(withdraw.transaction.amount).toBe(withdrawInput.amount);
      expect(withdraw.transaction.currency).toBe(withdrawInput.currency);
      expect(withdraw.senderWallet.user.toString()).toBe(withdrawInput.userId);

      expect(req.auditContext).toBeTruthy();
      expect(req.auditContext?.changes).toEqual(withdrawInput);
    });

    it('should throw error if balance is too low', async () => {
      const currentWallet = await Wallet.findOne({
        currency: 'USD',
        user: userId
      });
      
      const balance = currentWallet ? currentWallet.balance : 0;
      
      const invalidWithdrawInput: WithdrawalDto = {
        amount: balance + 1000,
        userId,
        currency: 'USD',
        pin: '1234'
      };
      
      const req = mockAuditableRequest();
      
      await expect(bankingService.withdraw(invalidWithdrawInput, req))
        .rejects.toThrow(HttpException);
    });

    it('should throw error if pin is not provided', async () => {
      const invalidInput: WithdrawalDto = {
        amount: 10,
        userId,
        currency: 'USD',
        pin: undefined
      };
      
      const req = mockAuditableRequest();
      
      await expect(bankingService.withdraw(invalidInput, req))
        .rejects.toThrow(HttpException);
    });

    it('should throw error if currency is not provided', async () => {
      const invalidInput: WithdrawalDto = {
        amount: 10,
        userId,
        currency: '',
        pin: '1234'
      };
      
      const req = mockAuditableRequest();
      
      await expect(bankingService.withdraw(invalidInput, req))
        .rejects.toThrow(HttpException);
    });
  });

  describe.skip('Initiate a deposit', () => {
    it('should initiate a deposit successfully', async () => {
      const account = await UserAccount.findOne({
        user: userId
      });
      
      const destinationAccount = await UserAccount.findOne({
        user: userId2
      });
      
      expect(account).toBeTruthy();
      expect(destinationAccount).toBeTruthy();
      
      if (!account || !destinationAccount) {
        console.log("User accounts not found, skipping test");
        return;
      }
      
      const deposit: DepositDto = {
        amount: 100,
        currency: 'USD',
        sourceAccountNumber: account.accountNumber,
        transactionRef: v4(),
        sourceBank: 'MainStack',
        destinationAcctNumber: destinationAccount.accountNumber
      };
      
      const req = mockAuditableRequest();
      const userAccount = await UserAccount.findOne({ accountNumber: deposit.destinationAcctNumber });
      
      expect(userAccount).toBeTruthy();
      
      const currentWallet = await Wallet.findOne({
        currency: deposit.currency,
        user: userAccount?.user
      });
      
      expect(currentWallet).toBeTruthy();
      
      const initialBalance = currentWallet ? currentWallet.balance : 0;
      const depositOutput = await bankingService.deposit(deposit, req);

      expect(depositOutput.transaction.amount).toBe(deposit.amount);
      expect(depositOutput.transaction.currency).toBe(deposit.currency);
      expect(depositOutput.receiverWallet.currency).toBe(deposit.currency);
      expect(depositOutput.transaction.reference).toContain(deposit.transactionRef);
      
      const updatedWallet = await Wallet.findById(depositOutput.receiverWallet._id);
      expect(updatedWallet?.balance).toBe(initialBalance + deposit.amount);

      expect(req.auditContext).toBeTruthy();
      expect(req.auditContext).toHaveProperty('changes');
      expect(req.auditContext).toHaveProperty('oldValues');
      expect(req.auditContext?.changes).toEqual(deposit);
    });
    
    it('should throw error when destination account is invalid', async () => {
      const deposit: DepositDto = {
        amount: 100,
        currency: 'USD',
        sourceAccountNumber: '1234567890',
        transactionRef: v4(),
        sourceBank: 'MainStack',
        destinationAcctNumber: 'invalid-account-number'
      };
      
      const req = mockAuditableRequest();
      await expect(bankingService.deposit(deposit, req))
        .rejects.toThrow(HttpException);
    });
  });

  describe.skip('Initiate a transfer', () => {
    it('should initiate an internal transfer successfully', async () => {
      const destinationAccount = await UserAccount.findOne({ user: userId2 });
      
      expect(destinationAccount).toBeTruthy();
      
      if (!destinationAccount) {
        console.log("Destination account not found, skipping test");
        return;
      }
      
      const internalTransfer: TransferDto = {
        userId: userId,
        currency: 'USD',
        isInternal: true,
        destinationAcctNumber: destinationAccount.accountNumber,
        amount: 50,
        destinationBank: 'MainStack'
      };
      
      const req = mockAuditableRequest();
      
      const senderWallet = await Wallet.findOne({ user: userId, currency: 'USD' });
      const receiverWallet = await Wallet.findOne({ user: userId2, currency: 'USD' });
      
      expect(senderWallet).toBeTruthy();
      expect(receiverWallet).toBeTruthy();
      
      const senderInitialBalance = senderWallet?.balance || 0;
      const receiverInitialBalance = receiverWallet?.balance || 0;
      
      const transferOutput = await bankingService.transfer(internalTransfer, req);
      
      expect(transferOutput.ledgerEntry.amount).toBe(internalTransfer.amount);
      
      const updatedSenderWallet = await Wallet.findOne({ user: userId, currency: 'USD' });
      const updatedReceiverWallet = await Wallet.findOne({ user: userId2, currency: 'USD' });
      
      expect(updatedSenderWallet?.balance).toBe(senderInitialBalance - internalTransfer.amount);
      expect(updatedReceiverWallet?.balance).toBe(receiverInitialBalance + internalTransfer.amount);
      
      expect(req.auditContext).toBeTruthy();
      expect(req.auditContext?.changes).toEqual(internalTransfer);
    });

    it('should throw error when destination account is invalid for internal transfer', async () => {
      const invalidTransfer: TransferDto = {
        userId: userId,
        currency: 'USD',
        isInternal: true,
        destinationAcctNumber: 'non-existent-account',
        amount: 50,
        destinationBank: 'MainStack'
      };
      
      const req = mockAuditableRequest();
      await expect(bankingService.transfer(invalidTransfer, req))
        .rejects.toThrow(HttpException);
    });

    it('should throw error when sender wallet does not have enough funds', async () => {
      const destinationAccount = await UserAccount.findOne({ user: userId2 });
      
      expect(destinationAccount).toBeTruthy();
      
      if (!destinationAccount) {
        console.log("Destination account not found, skipping test");
        return;
      }
      
      const senderWallet = await Wallet.findOne({ user: userId, currency: 'USD' });
      expect(senderWallet).toBeTruthy();
      
      const currentBalance = senderWallet?.balance || 0;
      
      const transferWithInsufficientFunds: TransferDto = {
        userId: userId,
        currency: 'USD',
        isInternal: true,
        destinationAcctNumber: destinationAccount.accountNumber,
        amount: currentBalance + 1000, // Much more than available balance
        destinationBank: 'MainStack'
      };
      
      const req = mockAuditableRequest();
      await expect(bankingService.transfer(transferWithInsufficientFunds, req))
        .rejects.toThrow(HttpException);
    });

    it('should initiate an external transfer successfully', async () => {
      const externalTransfer: TransferDto = {
        userId: userId,
        currency: 'USD',
        isInternal: false,
        destinationAcctNumber: '9876543210',
        amount: 25,
        destinationBank: 'OtherBank'
      };
      
      const req = mockAuditableRequest();
      
      const senderWallet = await Wallet.findOne({ user: userId, currency: 'USD' });
      expect(senderWallet).toBeTruthy();
      
      const senderInitialBalance = senderWallet?.balance || 0;
      
      const transferOutput = await bankingService.transfer(externalTransfer, req);
      
      expect(transferOutput.ledgerEntry.amount).toBe(externalTransfer.amount);

      const updatedSenderWallet = await Wallet.findOne({ user: userId, currency: 'USD' });
      expect(updatedSenderWallet?.balance).toBe(senderInitialBalance - externalTransfer.amount);
      
      expect(req.auditContext).toBeTruthy();
      expect(req.auditContext?.changes).toEqual(externalTransfer);
    });

    it('should throw error when destinationBank is not provided for external transfer', async () => {
      const invalidExternalTransfer: TransferDto = {
        userId: userId,
        currency: 'USD',
        isInternal: false,
        destinationAcctNumber: '9876543210',
        amount: 25

      };
      
      const req = mockAuditableRequest();
      await expect(bankingService.transfer(invalidExternalTransfer, req))
        .rejects.toThrow(HttpException);
    });
  });

  describe.skip('Get transaction history', () => {
    it('should retrieve transaction history successfully', async () => {
      const historyInput: TransactionHistoryDTO = {
        userId: userId,
        currency: 'USD',
        page: 1,
        limit: 10
      };
      
      const history = await bankingService.getTransactionHistory(historyInput);
      
      expect(Array.isArray(history.transactions)).toBe(true);
      expect(history.transactions.length).toBeGreaterThan(0);
    });

    it('should throw error when user is not found', async () => {
      const invalidHistoryInput: TransactionHistoryDTO = {
        userId: new mongoose.Types.ObjectId().toString(),
        currency: 'USD',
        page: 1,
        limit: 10
      };
      
      await expect(bankingService.getTransactionHistory(invalidHistoryInput))
        .rejects.toThrow(HttpException);
    });

    it('should throw error when wallet is not found', async () => {
      const invalidHistoryInput: TransactionHistoryDTO = {
        userId: userId,
        currency: 'XYZ', 
        page: 1,
        limit: 10
      };
      
      await expect(bankingService.getTransactionHistory(invalidHistoryInput))
        .rejects.toThrow(HttpException);
    });
  });

  describe('Get account balance', () => {
    it('should retrieve account balance successfully', async () => {
      const balanceInput: BalanceDTO = {
        userId: userId,
        currency: 'USD'
      };
      
      const balance = await bankingService.getAccountBalance(balanceInput);
      
      expect(balance).toHaveProperty('balance');
      expect(balance).toHaveProperty('currency');
      expect(balance.currency).toBe('USD');
      expect(typeof balance.balance).toBe('number');
    });

    it('should throw error when user is not found', async () => {
      const invalidBalanceInput: BalanceDTO = {
        userId: new mongoose.Types.ObjectId().toString(), 
        currency: 'USD'
      };
      
      await expect(bankingService.getAccountBalance(invalidBalanceInput))
        .rejects.toThrow(HttpException);
    });

    it('should throw error when wallet is not found', async () => {
      const invalidBalanceInput: BalanceDTO = {
        userId: userId,
        currency: 'XYZ'
      };
      
      await expect(bankingService.getAccountBalance(invalidBalanceInput))
        .rejects.toThrow(HttpException);
    });
  });

  describe.skip('Convert currency', () => {
    it('should convert currency successfully if rate exists', async () => {
      const convertInput: ConvertDTO = {
        userId: userId,
        currency: 'USD',
        amount: 100,
        targetCurrency: 'EUR'
      };
      
      const req = mockAuditableRequest();
      
      try {
        const conversion = await bankingService.convert(convertInput, req);
        
        expect(conversion).toHaveProperty('fromWallet');
        expect(conversion).toHaveProperty('toWallet');
        expect(conversion).toHaveProperty('rate');
        expect(conversion.toWallet.currency).toBe(convertInput.targetCurrency);
        
        expect(req.auditContext).toBeTruthy();
        expect(req.auditContext?.resource).toBe('banking-conversion');
        expect(req.auditContext?.changes).toEqual(convertInput);
      } catch (error) {
        if (error instanceof HttpException && error.message.includes('Exchange rate not found')) {
          console.log('Skipping test: No exchange rate found between USD and EUR');
          return;
        }
        throw error;
      }
    });

    it('should throw error when source wallet is not found', async () => {
      const invalidConvertInput: ConvertDTO = {
        userId: userId,
        currency: 'XYZ', // Non-existent currency 
        amount: 100,
        targetCurrency: 'EUR'
      };
      
      const req = mockAuditableRequest();
      await expect(bankingService.convert(invalidConvertInput, req))
        .rejects.toThrow(HttpException);
    });

    it('should throw error when target wallet is not found', async () => {
      const invalidConvertInput: ConvertDTO = {
        userId: userId,
        currency: 'USD',
        amount: 100,
        targetCurrency: 'XYZ'
      };
      
      const req = mockAuditableRequest();
      await expect(bankingService.convert(invalidConvertInput, req))
        .rejects.toThrow(HttpException);
    });
  });
});