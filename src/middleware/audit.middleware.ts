import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/audit-log.model';
import { logger } from '../utils/logger';
import { Send } from 'express-serve-static-core';
import mongoose from 'mongoose';

export interface AuditableRequest extends Request {
  auditContext?: {
    action: 'create' | 'update' | 'delete';
    resource: string;
    resourceId?: string;
    changes?: any;
    oldValues?: any;
  };
}

export const auditLog = () => {
  return (req: AuditableRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = (async function (this: Response, body?: any) {
        const auditContext = req.auditContext;

        if (auditContext && res.statusCode >= 200 && res.statusCode < 300) {
            const accountId = (req as any).account?.id;

            if (!accountId) {
                logger.warn('Audit log attempted without account ID');
                return originalSend.call(this, body);
            }

            try {
                const auditEntry = {
                    action: auditContext.action,
                    resource: auditContext.resource,
                    resourceId: auditContext.resourceId ? new mongoose.Types.ObjectId(auditContext.resourceId) : undefined,
                    accountId: new mongoose.Types.ObjectId(accountId),
                    changes: auditContext.action === 'update'
                        ? { before: auditContext.oldValues, after: auditContext.changes }
                        : auditContext.changes
                };

                if (!auditEntry.resourceId) {
                    delete auditEntry.resourceId;
                }

                await AuditLog.create(auditEntry);
                logger.info(`Audit log created for ${auditContext.action} on ${auditContext.resource}`,
                    { resourceId: auditContext.resourceId, accountId });
            } catch (error) {
                logger.error('Error creating audit log:', error);
            }
        }
        return originalSend.call(this, body);
    }) as unknown as Send;
    
    next();
  };
};