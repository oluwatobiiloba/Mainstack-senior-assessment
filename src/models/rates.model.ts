import mongoose, { Schema, Document } from "mongoose";

export interface ICurrencyRate extends Document {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  updatedAt: Date;
}

const CurrencyRateSchema = new Schema<ICurrencyRate>(
  {
    baseCurrency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    targetCurrency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

CurrencyRateSchema.index({ baseCurrency: 1, targetCurrency: 1 }, { unique: true });

export const CurrencyRate = mongoose.model<ICurrencyRate>("CurrencyRate", CurrencyRateSchema);
