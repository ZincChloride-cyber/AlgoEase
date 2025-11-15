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

    // Generate sample analytics data
    const now = new Date();
    const data = [];
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString(),
        transactions: Math.floor(Math.random() * 1000) + 500,
        tps: Math.floor(Math.random() * 100) + 700,
        blockTime: (Math.random() * 2 + 1).toFixed(2),
        gasUsed: Math.floor(Math.random() * 1000000) + 500000
      });
    }

    return NextResponse.json({ data, period: '24h' });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

