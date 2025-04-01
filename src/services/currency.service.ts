import { WalletService } from "./wallet.service";
import { CurrencyRate } from "../models/rates.model";
import { HttpException } from "../middleware/error.middleware";
import { logger } from "../utils/logger";
import mongoose, { ClientSession } from "mongoose";
import { ConvertCurrencyDto } from "../dtos/transaction.dto";
import { v4 as uuidv4 } from "uuid";

export class CurrencyService {
    private walletService = new WalletService();

    async convertCurrency(convertDto: ConvertCurrencyDto, session?: ClientSession): Promise<{ fromWallet: any; toWallet: any; rate: number }> {
        let newSession = false;
        if (!session) {
        session = await mongoose.startSession();
        session.startTransaction();
        newSession = true;
        }

        try {
        const { walletId, targetCurrency, amount, userId } = convertDto;

        const fromWallet = await this.walletService.getWalletById(walletId);
        const toWallet = await this.walletService.getWalletByCurrency(targetCurrency, userId);
        if (!fromWallet || !toWallet) throw new HttpException(404, "Wallets not found");
        if (fromWallet.currency === toWallet.currency) throw new HttpException(400, "Cannot convert to the same currency");

        const companyFromWallet = await this.walletService.getHoldingWallet(fromWallet.currency);
        const companyToWallet = await this.walletService.getHoldingWallet(toWallet.currency);
        if (!companyFromWallet || !companyToWallet) throw new HttpException(404, "Company wallets not found");

        const rateDoc = await CurrencyRate.findOne({ baseCurrency: fromWallet.currency, targetCurrency: toWallet.currency });
        if (!rateDoc) throw new HttpException(400, "Exchange rate not found");
        const convertedAmount = amount * rateDoc.rate;

        const ref = `conv-${uuidv4()}-${fromWallet.currency}-${toWallet.currency}`;

        // Debit user’s source wallet
        await this.walletService.debitWallet({ walletId: fromWallet.id, amount, currency: fromWallet.currency, ref }, session);

        // Credit company’s source wallet
        await this.walletService.creditWallet({ walletId: companyFromWallet.id, amount, currency: fromWallet.currency, ref }, session);

        // Debit company’s target currency wallet
        await this.walletService.debitWallet({ walletId: companyToWallet.id, amount: convertedAmount, currency: toWallet.currency, ref }, session);

        // Credit user’s target currency wallet
        await this.walletService.creditWallet({ walletId: toWallet.id, amount: convertedAmount, currency: toWallet.currency, ref }, session);

        if (newSession) {
            await session.commitTransaction();
            session.endSession();
        }

        return { fromWallet, toWallet, rate: rateDoc.rate };
        } catch (error) {
        if (newSession) {
            await session.abortTransaction();
            session.endSession();
        }
        logger.error("Error converting currency:", error);
        throw error;
        }
    }

}
