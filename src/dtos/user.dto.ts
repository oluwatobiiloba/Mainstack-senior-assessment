import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { Role } from '../interfaces/role.interface';

@Exclude()
export class RegisterUserDto {
    @Expose()
    @IsEmail()
    email!: string;

    @Expose()
    @IsString()
    @MinLength(8)
    password!: string;

    @Expose()
    @IsString()
    @MinLength(1)
    firstName!: string;

    @Expose()
    @IsString()
    @MinLength(1)
    lastName!: string;

    @Expose()
    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}

@Exclude()
export class LoginUserDto {
    @Expose()
    @IsEmail()
    email!: string;

    @Expose()
    @IsString()
    @MinLength(8)
    password!: string;
}

@Exclude()
export class UserResponseDto {
    @Expose()
    id!: string;

    @Expose()
    email!: string;

    @Expose()
    firstName!: string;

    @Expose()
    lastName!: string;

    @Expose()
    role!: Role;

    @Expose()
    createdAt!: Date;

    @Expose()
    updatedAt!: Date;
}