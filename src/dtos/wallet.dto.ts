import { IsString, IsNumber, Min, IsMongoId } from "class-validator";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class CreditWalletDto {
  @Expose()
  @IsMongoId()
  walletId!: string;

  @Expose()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @Expose()
  @IsString()
  currency!: string;

  @Expose()
  @IsString()
  ref!: string
}

@Exclude()
export class DebitWalletDto {
  @Expose()
  @IsMongoId()
  walletId!: string;

  @Expose()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @Expose()
  @IsString()
  currency!: string;

  @Expose()
  @IsString()
  ref!: string
}
