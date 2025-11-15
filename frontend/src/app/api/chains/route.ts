import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { chains } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = authenticateRequest(authHeader);

    if (!userId) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }

    const userChains = Array.from(chains.values()).filter(
      chain => chain.userId === userId
    );

    // Calculate stats
    const stats = {
      totalChains: userChains.length,
      activeChains: userChains.filter(c => c.status === 'active').length,
      totalTransactions: userChains.reduce((sum, c) => sum + (c.transactions || 0), 0),
      averageUptime: userChains.length > 0 
        ? userChains.reduce((sum, c) => sum + c.uptime, 0) / userChains.length 
        : 99.9
    };

    return NextResponse.json({ chains: userChains, stats });
  } catch (error) {
    console.error('Error fetching chains:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

