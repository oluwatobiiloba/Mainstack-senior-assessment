import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: 'create' | 'update' | 'delete';
  resource: string;
  resourceId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  changes: Record<string, any>;
  timestamp: Date;
}

const auditLogSchema = new Schema({
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete']
  },
  resource: {
    type: String,
    required: true,
    index: true
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  changes: {
    type: Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

auditLogSchema.index({ resource: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);