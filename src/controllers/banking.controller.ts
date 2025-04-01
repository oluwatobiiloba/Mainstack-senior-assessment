import { Request, Response, NextFunction } from 'express';
import { BankingService } from '../services/banking.service';
import { BalanceDTO, ConvertDTO, DepositDto, TransactionHistoryDTO, TransferDto, WithdrawalDto } from '../dtos/banking.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HttpException } from '../middleware/error.middleware';
import { AuditableRequest } from '../middleware/audit.middleware';

export class BankingController {
  private bankingService: BankingService;

  constructor() {
    this.bankingService = new BankingService();
  }

  private async validateParams(params: any, dto: any): Promise<void> {
    const validationParams = plainToInstance(dto, params);
    const errors = await validate(validationParams);
    if(errors.length) throw errors;
  }

  withdraw = async (req: AuditableRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(401, 'User not authenticated');
      }

      const withdrawalData = {
        ...req.body,
        userId
      };
      await this.validateParams(withdrawalData, WithdrawalDto);
      

      const result = await this.bankingService.withdraw(withdrawalData, req);
      res.status(200).json({
        success: true,
        message: 'Withdrawal successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  deposit = async (req: AuditableRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.validateParams(req.body, DepositDto);
      
      const result = await this.bankingService.deposit(req.body, req);
      res.status(200).json({
        success: true,
        message: 'Deposit successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  transfer = async (req: AuditableRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(401, 'User not authenticated');
      }

      const transferData = {
        ...req.body,
        userId
      };

      await this.validateParams(transferData, TransferDto);
      

      const result = await this.bankingService.transfer(transferData, req);
      res.status(200).json({
        success: true,
        message: 'Transfer successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getTransactionHistory = async (req: AuditableRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(401, 'User not authenticated');
      }

      const { currency, page, limit } = req.query;
      if (!currency || typeof currency !== 'string') {
        throw new HttpException(422, 'Currency is required');
      }

      const historyData: TransactionHistoryDTO = {
        userId,
        currency,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10
      };

      await this.validateParams(historyData, TransactionHistoryDTO);
      
      const result = await this.bankingService.getTransactionHistory(historyData);
      res.status(200).json({
        success: true,
        message: 'Transaction history retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getAccountBalance = async (req: AuditableRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(401, 'User not authenticated');
      }

      const { currency } = req.query;
      if (!currency || typeof currency !== 'string') {
        throw new HttpException(422, 'Currency is required');
      }

      const balanceData: BalanceDTO = {
        userId,
        currency
      };

      await this.validateParams(balanceData, BalanceDTO);
      
      const result = await this.bankingService.getAccountBalance(balanceData);
      res.status(200).json({
        success: true,
        message: 'Account balance retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  convert = async (req: AuditableRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(401, 'User not authenticated');
      }

      const convertData = {
        ...req.body,
        userId
      };
    
      
      await this.validateParams(convertData, ConvertDTO);

      const result = await this.bankingService.convert(convertData, req);
      res.status(200).json({
        success: true,
        message: 'Currency conversion successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}