import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { authenticateRequest } from '@/lib/auth';
import { chains } from '@/lib/storage';

export const dynamic = 'force-dynamic';

async function deployChain(chainId: string, chain: any) {
  // Simulate deployment process
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const updatedChain = chains.get(chainId);
  if (updatedChain) {
    updatedChain.status = 'active';
    updatedChain.uptime = 99.9;
    updatedChain.tps = Math.floor(Math.random() * 500) + 500;
    chains.set(chainId, updatedChain);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = authenticateRequest(authHeader);

    if (!userId) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }

    const { name, chainType, rollupType, gasToken, validatorAccess, initialValidators } = await request.json();

    // Validation
    if (!name || !chainType || !rollupType || !gasToken) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const chainId = uuidv4();
    const chain = {
      id: chainId,
      userId,
      name,
      chainType,
      rollupType,
      gasToken: gasToken.toUpperCase(),
      validatorAccess: validatorAccess || 'public',
      validators: parseInt(initialValidators) || 3,
      status: 'deploying' as const,
      uptime: 0,
      tps: 0,
      transactions: 0,
      createdAt: new Date().toISOString(),
      rpcUrl: `https://rpc-${chainId.substring(0, 8)}.polyone.io`,
      explorerUrl: `https://explorer-${chainId.substring(0, 8)}.polyone.io`,
      chainId: Math.floor(Math.random() * 1000000) + 100000
    };

    chains.set(chainId, chain);

    // Start deployment process (async)
    deployChain(chainId, chain).catch(error => {
      console.error('Deployment error:', error);
      const updatedChain = chains.get(chainId);
      if (updatedChain) {
        updatedChain.status = 'failed';
        chains.set(chainId, updatedChain);
      }
    });

    return NextResponse.json({
      message: 'Chain deployment started',
      chainId,
      chain
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating chain:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

