import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { RegisterAccountDto, LoginAccountDto, AccountResponseDto } from '../dtos/account.dto';
import { HttpException } from '../middleware/error.middleware';
import { Role } from '../interfaces/role.interface';
import { UserAccount } from '../models/user-account.model';
import { WalletService } from './wallet.service';

export class AuthService {
  private walletService: WalletService;

  constructor(){
    this.walletService = new WalletService();
  }
  async register(accountData: RegisterAccountDto): Promise<AccountResponseDto> {
    const existingAccount = await User.findOne({ email: accountData.email });
    if (existingAccount) {
      throw new HttpException(409, 'Email already exists');
    }

    accountData.role = Role.USER;

    const account = await User.create(accountData);

    await Promise.all([
      UserAccount.create({
        user: account.id
      }),
      this.walletService.createWalletInAllCurrencies(account.id)
    ])
    return this.transformToDto(account);
  }

  async login(loginData: LoginAccountDto): Promise<{ token: string; account: AccountResponseDto }> {
    const account = await User.findOne({ email: loginData.email }).select('+password');
    if (!account) {
      throw new HttpException(401, 'Invalid credentials');
    }

    const isPasswordValid = await account.comparePassword(loginData.password);
    if (!isPasswordValid) {
      throw new HttpException(401, 'Invalid credentials');
    }

    const token = this.generateToken(account.id, account.role);
    return {
      token,
      account: this.transformToDto(account)
    };
  }

  private generateToken(accountId: string, role: Role): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const expirationMinutes = parseInt(process.env.JWT_EXPIRATION_MINUTES || '30', 10);
    
    return jwt.sign(
      { id: accountId, role },
      jwtSecret,
      { expiresIn: expirationMinutes * 60 } 
    );
  }

  private transformToDto(account: any): AccountResponseDto {
    const { _id, password, __v, ...rest } = account.toObject();
    return { id: _id.toString(), ...rest };
  }
}