import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role } from '../interfaces/role.interface';

export interface IUser extends Document {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [8, 'Password must be at least 8 characters long']
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: Object.values(Role),
    default: Role.USER
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.virtual("wallets", {
  ref: "Wallet",
  localField: "_id",
  foreignField: "user",
});


userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

export const User = mongoose.model<IUser>('User', userSchema);