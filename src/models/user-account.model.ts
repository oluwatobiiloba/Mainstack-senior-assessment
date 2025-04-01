import mongoose, { Document, Schema } from "mongoose";

export interface IUserAccount extends Document {
  user: mongoose.Types.ObjectId;
  accountNumber: string;
}

const userAccountSchema = new Schema<IUserAccount>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
  },
  accountNumber: { 
    type: String, 
    unique: true 
  }
});


userAccountSchema.pre<IUserAccount>("save", async function (next) {
  if (!this.accountNumber) {
    this.accountNumber = await generateUniqueAccountNumber();
  }
  next();
});


async function generateUniqueAccountNumber(): Promise<string> {
    let accountNumber = "";
    let exists = true;

    while (exists) {
        accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        exists = (await UserAccount.exists({ accountNumber })) !== null;
    }

    return accountNumber;
  }

export const UserAccount = mongoose.model<IUserAccount>("UserAccount", userAccountSchema);