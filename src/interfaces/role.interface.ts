export type Action = 'create' | 'read' | 'update' | 'delete';
export type Resource = 'users' | 'transactions' | 'banking' | 'wallets' | 'accounts';

export interface Permission {
  action: Action;
  resource: Resource;
}

export interface UserPermission {
  userId: string;
  permissions: Permission[];
}

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
}

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    { action: 'create', resource: 'users' },
    { action: 'read', resource: 'users' },
    { action: 'update', resource: 'users' },
    { action: 'delete', resource: 'users' },
    

    { action: 'create', resource: 'banking' },
    { action: 'read', resource: 'banking' },
    { action: 'update', resource: 'banking' },
    { action: 'delete', resource: 'banking' },
    
    { action: 'create', resource: 'accounts' },
    { action: 'read', resource: 'accounts' },
    { action: 'update', resource: 'accounts' },
    { action: 'delete', resource: 'accounts' }
  ],
  
  [Role.USER]: [
    { action: 'read', resource: 'users' },
    
    { action: 'create', resource: 'transactions' },
    { action: 'read', resource: 'transactions' },
    
    { action: 'create', resource: 'banking' },
    { action: 'read', resource: 'banking' },
    
    { action: 'read', resource: 'wallets' },
    
    { action: 'read', resource: 'accounts' }
  ],
};