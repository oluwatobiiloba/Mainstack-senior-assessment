import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  wallet: mongoose.Types.ObjectId;
  type: WalletActionEnum;
  amount: number;
  currency: string;
  reference: string;
  metadata?: Record<string, unknown>;
}

export enum WalletActionEnum  {
  CREDIT = "credit",
  DEBIT = "debit",
  CONVERSION = "conversion",
  TRANSFER = "transfer"
}

const TransactionSchema = new Schema<ITransaction>(
  {
    wallet: { type: Schema.Types.ObjectId, ref: "Wallet", required: true , index: true},
    type: { type: String, enum: WalletActionEnum, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    reference: { type: String, sparse: true, unique: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>("Transaction", TransactionSchema);
