// In-memory storage (replace with database in production)
// For Vercel, consider using Vercel KV, Postgres, or another database service

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  password: string;
  createdAt: string;
}

export interface Chain {
  id: string;
  userId: string;
  name: string;
  chainType: string;
  rollupType: string;
  gasToken: string;
  validatorAccess: string;
  validators: number;
  status: 'deploying' | 'active' | 'failed';
  uptime: number;
  tps: number;
  transactions: number;
  createdAt: string;
  rpcUrl: string;
  explorerUrl: string;
  chainId: number;
}

// In-memory storage maps
export const users = new Map<string, User>();
export const chains = new Map<string, Chain>();

