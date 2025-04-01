import { Transform } from "class-transformer";
import { IsUUID, IsNotEmpty, IsNumber, IsPositive, IsString, IsDefined, IsOptional, Min, IsBoolean } from "class-validator";

export class WithdrawalDto {
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @IsNumber()
    @IsPositive()
    amount!: number;

    @IsString()
    @IsNotEmpty()
    currency!: string;

    @IsDefined()
    @IsString()
    pin?: string;
}

export class DepositDto {

    @IsNumber()
    @IsPositive()
    amount!: number;

    @IsString()
    @IsNotEmpty()
    currency!: string;

    @IsString()
    @IsNotEmpty()
    transactionRef!: string

    @IsString()
    @IsNotEmpty()
    sourceBank!: string


    @IsString()
    @IsNotEmpty()
    destinationAcctNumber!: string

    @IsString()
    @IsNotEmpty()
    sourceAccountNumber!: string
}

export class TransferDto {
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @IsNumber()
    @IsPositive()
    amount!: number;

    @IsString()
    @IsNotEmpty()
    currency!: string;

    @IsString()
    @IsNotEmpty()
    destinationAcctNumber!: string;

    @IsBoolean()
    @IsNotEmpty()
    isInternal!: boolean

    @IsOptional()
    @IsString()
    destinationBank?: string
}

export class ExtTransferDto {
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @IsNumber()
    @IsPositive()
    amount!: number;

    @IsString()
    @IsNotEmpty()
    currency!: string;

    @IsString()
    @IsNotEmpty()
    destinationAccountNumber!: string;

    @IsString()
    @IsNotEmpty()
    bank!: string;
}

export class TransactionHistoryDTO {
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @IsString()
    @IsNotEmpty()
    currency!: string;
    
    @Transform((x)=> parseInt(x.value))
    @Min(1)
    @IsOptional()
    limit?: number;

    @Transform((x)=> parseInt(x.value))
    @Min(1)
    @IsOptional()
    page?: number;
}

export class BalanceDTO {
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @IsString()
    @IsNotEmpty()
    currency!: string;
}


export class ConvertDTO {
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @IsString()
    @IsNotEmpty()
    currency!: string;

    @IsString()
    @IsNotEmpty()
    targetCurrency!: string;

    @IsNumber()
    @IsPositive()
    amount!: number;
}