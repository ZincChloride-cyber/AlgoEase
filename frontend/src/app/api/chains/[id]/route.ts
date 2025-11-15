import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { chains } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    const resolvedParams = await Promise.resolve(params);
    const chain = chains.get(resolvedParams.id);
    
    if (!chain) {
      return NextResponse.json(
        { message: 'Chain not found' },
        { status: 404 }
      );
    }

    if (chain.userId !== userId) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(chain);
  } catch (error) {
    console.error('Error fetching chain:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    const resolvedParams = await Promise.resolve(params);
    const chain = chains.get(resolvedParams.id);
    
    if (!chain) {
      return NextResponse.json(
        { message: 'Chain not found' },
        { status: 404 }
      );
    }

    if (chain.userId !== userId) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updatedChain = { ...chain, ...body, id: chain.id, userId: chain.userId };
    chains.set(resolvedParams.id, updatedChain);

    return NextResponse.json({ message: 'Chain updated', chain: updatedChain });
  } catch (error) {
    console.error('Error updating chain:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    const resolvedParams = await Promise.resolve(params);
    const chain = chains.get(resolvedParams.id);
    
    if (!chain) {
      return NextResponse.json(
        { message: 'Chain not found' },
        { status: 404 }
      );
    }

    if (chain.userId !== userId) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

    chains.delete(resolvedParams.id);

    return NextResponse.json({ message: 'Chain deleted successfully' });
  } catch (error) {
    console.error('Error deleting chain:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

