import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class EnvironmentVariables {
  @IsNotEmpty()
  @IsString()
  MONGODB_URI!: string;

  @IsNotEmpty()
  @IsString()
  JWT_SECRET!: string;

  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @Max(60)
  JWT_EXPIRATION_MINUTES!: number;

  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  PORT!: number;

  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  RATE_LIMIT_WINDOW_MS!: number;

  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  RATE_LIMIT_MAX!: number;
}