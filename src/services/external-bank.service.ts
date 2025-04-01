import { HttpException } from "../middleware/error.middleware";
import { logger } from "../utils/logger";

interface TransferRequest {
  accountNumber: string;
  bank: string;
  amount: number;
  currency: string;
  reference: string;
}

interface TransferResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

interface ConfirmTransfer {
    transactionReference: string;
    amount: number;
    currency: string;
    senderAccount: string;
    recipientAccount: string;
    bank: string;
}

export class ExternalBankService {
    async processTransfer(transferRequest: TransferRequest): Promise<TransferResponse> {
        try {
        logger.info(`Processing external transfer:`, transferRequest);
        
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Simulating success or failure randomly for testing purposes
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
            const extTransactionId = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            logger.info(`Transfer successful. Transaction ID: ${extTransactionId}`);
            return { success: true, message: "Transfer completed successfully",  transactionId: extTransactionId };
        } else {
            logger.warn("Transfer failed due to external provider error.");
            return { success: false, message: "External provider error: Transfer failed" };
        }
        } catch (error) {
        logger.error("Error processing external transfer:", error);
        return { success: false, message: "An unexpected error occurred during transfer" };
        }
    }

    async confirmIncomingTransfer(transferDetails: ConfirmTransfer): Promise<{ valid: boolean; message: string }> {
        try {
            const { transactionReference, amount, currency, senderAccount, recipientAccount , bank} = transferDetails;
    
            if (!transactionReference || !amount || !currency || !senderAccount || !recipientAccount || !bank) {
                throw new HttpException(400, "Invalid transfer details provided");
            }
        
            // Mock API validation (replace with actual external bank validation)
            const externalValidation = await this.validateWithExternalProvider(transactionReference, transferDetails);
        
            if (!externalValidation.success) {
                logger.warn(`Incoming transfer validation failed: ${externalValidation.message}`);
                return { valid: false, message: externalValidation.message || "Invalid ref" };
            }
        
            // Validate amount and currency match
            if (externalValidation.amount !== amount || externalValidation.currency !== currency) {
                return { valid: false, message: "Transfer details do not match expected values" };
            }
        
            // Validate sender and recipient
            if (externalValidation.senderAccount !== senderAccount || externalValidation.recipientAccount !== recipientAccount) {
                return { valid: false, message: "Sender or recipient details do not match" };
            }
        
            return { valid: true, message: "Transfer is valid" };
        } catch (error) {
            logger.error("Error validating incoming transfer:", error);
            throw new HttpException(500, "Error validating incoming transfer");
        }
    }
    
    private async validateWithExternalProvider(transactionReference: string,transferDetails: ConfirmTransfer): Promise<{ success: boolean; amount: number; currency: string; senderAccount: string; recipientAccount: string; message?: string }> {

    //mock call
    return {
        success: true,
        amount: transferDetails.amount,
        currency: transferDetails.currency,
        senderAccount: transferDetails.senderAccount,
        recipientAccount: transferDetails.recipientAccount
    };
    }
    
}
