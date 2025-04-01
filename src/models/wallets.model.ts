import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  user: mongoose.Types.ObjectId;
  balance: number;
  currency: string;
}

const WalletSchema = new Schema<IWallet>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true ,
    index: true
  },
  balance: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  currency: { 
    type: String, 
    required: true 
  },
});

WalletSchema.index({ user: 1, currency: 1 }, { unique: true });

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);
