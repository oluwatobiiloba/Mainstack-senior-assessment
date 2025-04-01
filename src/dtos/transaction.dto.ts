import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, IsNumber, IsPositive, IsUUID, IsOptional, Min } from "class-validator";

export class CreditTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  walletId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsString()
  @IsOptional()
  ref?: string;
}

export class DebitTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  walletId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsString()
  @IsOptional()
  ref?: string;
}

export class TransferFundsDto {
    @IsUUID()
    @IsNotEmpty()
    senderWalletId!: string;

    @IsUUID()
    @IsNotEmpty()
    receiverWalletId!: string;

    @IsNumber()
    @IsPositive()
    amount!: number;

    @IsString()
    @IsNotEmpty()
    currency!: string;

    @IsString()
    @IsOptional()
    ref?: string;
}

export class WithdrawFundsDto {
    @IsUUID()
    @IsNotEmpty()
    sourceWalletId!: string;

    @IsNumber()
    @IsPositive()
    amount!: number;

    @IsString()
    @IsNotEmpty()
    currency!: string;

    @IsString()
    @IsOptional()
    ref?: string;
}

export class DepositFundsDto {
    @IsUUID()
    @IsNotEmpty()
    destinationWalletId!: string;

    @IsNumber()
    @IsPositive()
    amount!: number;

    @IsString()
    @IsNotEmpty()
    currency!: string;

    @IsString()
    @IsOptional()
    ref?: string;
}

export class TransferFundsExternalDto {
    @IsUUID()
    @IsNotEmpty()
    senderWalletId!: string;

    @IsString()
    @IsNotEmpty()
    destinationBank!: string;

    @IsString()
    @IsNotEmpty()
    destinationAccountNumber!: string

    @IsNumber()
    @IsPositive()
    amount!: number;

    @IsString()
    @IsNotEmpty()
    currency!: string;

    @IsString()
    @IsOptional()
    ref?: string;
}

export class GetWalletHistoryDto {
  @IsUUID()
  @IsNotEmpty()
  walletId!: string;

  @Transform((x)=> parseInt(x.value))
  @Min(1)
  @IsOptional()
  limit?: number;

  @Transform((x)=> parseInt(x.value))
  @Min(1)
  @IsOptional()
  page?: number;
}

export class ConvertCurrencyDto {
  @IsUUID()
  @IsNotEmpty()
  walletId!: string;

  @IsString()
  @IsNotEmpty()
  targetCurrency!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number; 

  @IsString()
  @IsNotEmpty()
  userId!: string; 
}


export class ReceiveFundsExternalDto {
    @IsString()
    @IsNotEmpty()
    receiverWalletId!: string;

    @IsString()
    @IsNotEmpty()
    sourceAccountNumber!: string;

    @IsString()
    @IsNotEmpty()
    sourceBank!: string;

    @IsNumber()
    @IsPositive()
    amount!: number;

    @IsString()
    @IsNotEmpty()
    currency!: string;

    @IsString()
    @IsNotEmpty()
    recipientAccount!: string;

    @IsString()
    @IsNotEmpty()
    ref!: string;
}