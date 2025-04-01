import { Wallet } from "../models/wallets.model";
import { HttpException } from "../middleware/error.middleware";
import { TransactionService } from "./transaction.service";
import { BalanceDTO, ConvertDTO, DepositDto, TransactionHistoryDTO, TransferDto, WithdrawalDto } from "@/dtos/banking.dto";
import { User } from "../models/user.model";
import { UserAccount } from "../models/user-account.model";
import { withRetry } from "./utils.services";
import { AuditableRequest } from "@/middleware/audit.middleware";
import { Document } from "mongoose";

export class BankingService {
    private transactionService: TransactionService;

    constructor() {
        this.transactionService = new TransactionService();
    }

    async withdraw(withdrawalInput: WithdrawalDto, req: AuditableRequest){
        const {amount, pin, userId , currency } =  withdrawalInput;
        if(!currency || currency.length < 0) throw new HttpException(422, "Currency not provided");
        if(!amount || amount < 0) throw new HttpException(403, "Invalid Amount");
        if(!pin)  throw new HttpException(422, "Pin not provided");

        const [user, wallet] = await Promise.all([
            User.findOne({ _id: userId }),
            Wallet.findOne({ user: userId, currency })
        ])

        console.log(user,userId)
        if(!user) throw new HttpException(422, "User Not found");

        if(!wallet) throw new HttpException(422, "Wallet Not found");

        const withdrawal = await this.transactionService.withdrawFunds({
            amount,
            currency,
            sourceWalletId:  wallet.id
        })


        req.auditContext = {
            action: 'create',
            resource: 'banking-withdrawal',
            resourceId: (withdrawal.senderWallet as Document).id,
            changes: withdrawalInput
        };
        return withdrawal
    }

    async deposit(depositInput: DepositDto, req: AuditableRequest){
        const { amount, currency, sourceAccountNumber, transactionRef, sourceBank, destinationAcctNumber} = depositInput
        const  destinationAccount  = await  UserAccount.findOne({accountNumber: destinationAcctNumber});
        if(!destinationAccount) throw new HttpException(422, "invalid Account");

        const receiversWallet = await Wallet.findOne({
            user: destinationAccount.user,
            currency: currency
        })
        

        const deposit = await this.transactionService.receiveFundsExternal({
            receiverWalletId: receiversWallet?.id,
            sourceAccountNumber: sourceAccountNumber,
            sourceBank: sourceBank,
            amount: amount,
            currency: currency,
            recipientAccount: destinationAcctNumber,
            ref: transactionRef,
        })

        req.auditContext = {
            action: 'create',
            resource: 'banking-deposit',
            resourceId: (deposit?.receiverWallet.id as Document).id,
            changes: depositInput,
            oldValues: receiversWallet
        };

        return deposit
    }

    async transfer(transferInput: TransferDto, req: AuditableRequest){
        const { userId, currency, isInternal, destinationAcctNumber, amount, destinationBank } = transferInput;
        const  [destinationAccount, sendersWallet]  = await Promise.all(
            [
                UserAccount.findOne({accountNumber: destinationAcctNumber}),
                Wallet.findOne({user: userId,currency}),
            ]
        )
        if(!destinationAccount && !isInternal) throw new HttpException(422, "invalid Account");
        if(!sendersWallet) throw new HttpException(422, "Sender Wallet Not found");

        const receiversWallet = isInternal && destinationAccount && await Wallet.findOne({
            user: destinationAccount.user,
            currency: currency
        })

        if(!receiversWallet && isInternal)  throw new HttpException(422, "Receivers Wallet Not found");

        let transfer: {
            senderWallet: any;
            receiverWallet?: any;
            ledgerEntry: any;
        };
        if(isInternal && receiversWallet ){
            transfer = await this.transactionService.transferFundsInternal({
                senderWalletId: sendersWallet.id,
                receiverWalletId: receiversWallet.id,
                amount,
                currency,
            })
        } else {

            if(!destinationBank) throw new HttpException(422, "Destination Bank not provided found");

            transfer = await  this.transactionService.transferFundsExternal({
                senderWalletId: sendersWallet.id,
                destinationBank,
                destinationAccountNumber: destinationAcctNumber,
                amount,
                currency,
            })
        }

        req.auditContext = {
            action: 'create',
            resource: 'banking-transfer',
            resourceId: sendersWallet.id,
            changes: transferInput,
            oldValues: sendersWallet
        };

        return transfer
    }

    async getTransactionHistory(transactionHistoryInput: TransactionHistoryDTO){
        const {userId, currency} = transactionHistoryInput
        if(!userId) throw new HttpException(422, "User Not provided");
        if(!currency) throw new HttpException(422, "Currency Not provided");


        const [wallet, user] = await Promise.all (
            [
                Wallet.findOne({
                    user: userId,
                    currency
                }),
                User.findOne({
                    _id: userId
                })
            ])

        if(!user) throw new HttpException(422, "User Not Found");
        if(!wallet) throw new HttpException(422, "Wallet Not Found");

        return this.transactionService.getWalletHistory({
            walletId: wallet.id,
            page: transactionHistoryInput.page,
            limit: transactionHistoryInput.limit
        })
    }

    async getAccountBalance(balanceInput: BalanceDTO){
        const {userId, currency} = balanceInput
        if(!userId) throw new HttpException(422, "User Not provided");
        if(!currency) throw new HttpException(422, "Currency Not provided");


        const [wallet, user] = await Promise.all (
            [
                Wallet.findOne({
                    user: userId,
                    currency
                }),
                User.findOne({
                    _id: userId
                })
            ])

        if(!user) throw new HttpException(422, "User Not Found");
        if(!wallet) throw new HttpException(422, "Wallet Not Found");

        return this.transactionService.getAccountBalance( wallet.id)
    }

    async convert(convertInput: ConvertDTO, req: AuditableRequest) {
        const { userId, currency, amount, targetCurrency } = convertInput;
        if (!userId) throw new HttpException(422, "User Not provided");
        if (!currency) throw new HttpException(422, "Currency Not provided");
        if (!amount) throw new HttpException(422, "Amount Not provided");
    
        const wallet = await Wallet.findOne({ user: userId, currency });
        if (!wallet) throw new HttpException(422, "Wallet Not Found");
    
        const conversion = await this.transactionService.convertCurrency({
            walletId: wallet.id,
            targetCurrency,
            amount,
            userId
        });
    
        req.auditContext = {
            action: 'create',
            resource: 'banking-conversion',
            resourceId: wallet.id,
            changes: convertInput
        };
    
        return conversion;
    }
}
