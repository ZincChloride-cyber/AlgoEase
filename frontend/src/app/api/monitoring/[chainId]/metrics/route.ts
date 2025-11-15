import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> | { chainId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = authenticateRequest(authHeader);

    if (!userId) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }

    // Generate sample metrics (replace with real data from monitoring service)
    const metrics = {
      timestamp: new Date().toISOString(),
      tps: Math.floor(Math.random() * 200) + 800,
      blockTime: (Math.random() * 2 + 1).toFixed(2),
      gasPrice: (Math.random() * 0.001).toFixed(6),
      activeValidators: Math.floor(Math.random() * 5) + 10,
      networkHashrate: (Math.random() * 100 + 400).toFixed(2),
      pendingTransactions: Math.floor(Math.random() * 100),
      uptime: (99 + Math.random()).toFixed(2)
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

