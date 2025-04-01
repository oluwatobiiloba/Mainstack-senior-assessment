import { BankingService } from '../../src/services/banking.service';
import { Transaction } from '../../src/models/transaction.model';
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

describe('BankingService', () => {
  let bankingService: BankingService;
  let authService: AuthService;
  let userId = new mongoose.Types.ObjectId().toString();
  let userId2 = new mongoose.Types.ObjectId().toString();
  const mockAuditableRequest = (): AuditableRequest => {
    return {
      user: { id: userId },
      auditContext: undefined
    } as unknown as AuditableRequest;
  };

  beforeEach(() => {
    bankingService = new BankingService();
  });

  beforeAll(async ()=> {    
    authService = new AuthService()
    const testUser =  await authService.register({
      "email": "oluwatobiloba.f.a+testerUser@gmail.com",
      "password": "password",
      "firstName": "Oluwatobiloba",
      "lastName": "Substack"
    })

    const testUser2 =  await authService.register({
      "email": "oluwatobiloba.f.a+testerUser2@gmail.com",
      "password": "password",
      "firstName": "Oluwatobiloba",
      "lastName": "Substack"
    })
    userId = testUser.id
    userId2 = testUser2.id
  })

  describe('Initiate a withdrawal', () => {
    const withdrawInput: WithdrawalDto = {
      amount: 10,
      userId: userId,
      currency: 'USD',
      pin: '1234'
    };

    it('should create a withdrawal successfully', async () => {
      const req = mockAuditableRequest();
      console.log(withdrawInput)
      const withdraw = await bankingService.withdraw(withdrawInput, req);
      expect(withdraw.transaction.amount).toBe(withdrawInput.amount);
      expect(withdraw.transaction.currency).toBe(withdrawInput.currency);
      expect(withdraw.senderWallet.user).toBe(withdrawInput.userId);

      expect(req.auditContext).toBeTruthy();
      expect(req.auditContext?.changes).toEqual(withdrawInput);
    });

    it('should throw error if balance is too low', async () => {
      const currentWallet = await Wallet.findOne({
        currency: withdrawInput.currency,
        user: withdrawInput.userId
      });
      let balance = currentWallet ? currentWallet.balance : 0;
      // Increase amount beyond available balance.
      const invalidWithdrawInput = { ...withdrawInput, amount: withdrawInput.amount + balance + 1 };
      const req = mockAuditableRequest();
      await expect(bankingService.withdraw(invalidWithdrawInput, req)).rejects.toThrow(HttpException);
    });

    it('should throw error if pin is not provided', async () => {
      const invalidInput = { ...withdrawInput, pin: undefined };
      const req = mockAuditableRequest();
      await expect(bankingService.withdraw(invalidInput, req)).rejects.toThrow(HttpException);
    });

    it('should throw error if currency is not provided', async () => {
      const invalidInput = { ...withdrawInput, currency: '' };
      const req = mockAuditableRequest();
      await expect(bankingService.withdraw(invalidInput, req)).rejects.toThrow(HttpException);
    });
  });

  describe('Initiate a deposit', () => {

    it('should initiate a deposit successfully', async () => {
      const account = await UserAccount.findOne({
        user: userId
      })
      const destaccount = await UserAccount.findOne({
        user: userId2
      })
      const deposit: DepositDto = {
        amount: 100,
        currency: 'USD',
        sourceAccountNumber: (account && account?.accountNumber) as string,
        transactionRef: v4(),
        sourceBank: 'MainStack',
        destinationAcctNumber:  (destaccount && destaccount?.accountNumber) as string
      };
      const req = mockAuditableRequest();
      const userAccount = await UserAccount.findOne({ accountNumber: deposit.destinationAcctNumber });
      const currentWallet = await Wallet.findOne({
        currency: deposit.currency,
        user: userAccount?.user
      });
      const depositOutput = await bankingService.deposit(deposit, req);

      expect(depositOutput.transaction.amount).toBe(deposit.amount);
      expect(depositOutput.transaction.currency).toBe(deposit.currency);
      expect(depositOutput.receiverWallet.currency).toBe(deposit.currency);
      expect(depositOutput.transaction.reference).toBe(deposit.transactionRef);
      if (currentWallet && currentWallet.balance !== undefined) {
        expect(depositOutput.receiverWallet.balance).toBe(currentWallet.balance + deposit.amount);
      }

      expect(req.auditContext).toBeTruthy();
      expect(req.auditContext).toHaveProperty('changes');
      expect(req.auditContext).toHaveProperty('oldValues');
      expect(req.auditContext?.changes).toEqual(deposit);
    });
  });

  describe('Initiate a transfer', () => {
    const internalTransfer: TransferDto = {
      userId: userId,
      currency: 'USD',
      isInternal: true,
      destinationAcctNumber: '3809383291',
      amount: 50,
      destinationBank: 'MainStack' // destinationBank is ignored for internal transfers
    };

    const externalTransfer: TransferDto = {
      userId: userId,
      currency: 'USD',
      isInternal: false,
      destinationAcctNumber: '9876543210',
      amount: 75,
      destinationBank: 'OtherBank'
    };

    it('should initiate an internal transfer successfully', async () => {
      const req = mockAuditableRequest();
      const transferOutput = await bankingService.transfer(internalTransfer, req);
      expect(transferOutput.ledgerEntry.amount).toBe(internalTransfer.amount);
      expect(req.auditContext).toBeTruthy();
      expect(req.auditContext?.changes).toEqual(internalTransfer);
    });

    it('should initiate an external transfer successfully', async () => {
      const req = mockAuditableRequest();
      const transferOutput = await bankingService.transfer(externalTransfer, req);
      expect(transferOutput.ledgerEntry.amount).toBe(externalTransfer.amount);
      expect(req.auditContext).toBeTruthy();
      expect(req.auditContext?.changes).toEqual(externalTransfer);
    });
  });

  describe('Get transaction history', () => {
    const historyInput: TransactionHistoryDTO = {
      userId: userId,
      currency: 'USD',
      page: 1,
      limit: 10
    };

    it('should retrieve transaction history successfully', async () => {
      const req = mockAuditableRequest();
      const history = await bankingService.getTransactionHistory(historyInput);
      expect(Array.isArray(history.transactions)).toBe(true);

    });
  });

  describe('Get account balance', () => {
    const balanceInput: BalanceDTO = {
      userId: userId,
      currency: 'USD'
    };

    it('should retrieve account balance successfully', async () => {
      const req = mockAuditableRequest();
      const balance = await bankingService.getAccountBalance(balanceInput);
      expect(balance).toHaveProperty('amount');

    });
  });

  describe('Convert currency', () => {
    const convertInput: ConvertDTO = {
      userId: userId,
      currency: 'USD',
      amount: 100,
      targetCurrency: 'EUR'
    };

    it('should convert currency successfully', async () => {
      const req = mockAuditableRequest();
      const conversion = await bankingService.convert(convertInput, req);
      expect(conversion).toHaveProperty('convertedAmount');
      expect(conversion.toWallet.currency).toBe(convertInput.targetCurrency);
      expect(req.auditContext).toBeTruthy();
      expect(req.auditContext?.resource).toBe('banking-conversion');
      expect(req.auditContext?.changes).toEqual(convertInput);
    });
  });
});
