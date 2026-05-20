import { NextResponse } from 'next/server';
import { createProduct, deleteProduct } from '@/lib/actions/product.actions';
import { formatError } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const logContext = { route: 'api.products.admin.create' } as const;
  try {
    const session = await auth();
    
    if (!session) {
      const allCookies = request.headers.get('cookie') || 'none';
      logger.warn({ ...logContext, allCookies }, 'No session found in API');
      return NextResponse.json(
        { 
          success: false, 
          message: 'DEBUG: No session found', 
          receivedCookies: allCookies.substring(0, 50) + '...' 
        },
        { status: 401 }
      );
    }

    if (session.user?.role !== 'admin') {
      logger.warn({ ...logContext, role: session.user?.role, email: session.user?.email }, 'Non-admin access attempt');
      return NextResponse.json(
        { 
          success: false, 
          message: `DEBUG: Forbidden. Role is ${session.user?.role}`,
          user: session.user?.email 
        },
        { status: 403 }
      );
    }

    const data = await request.json();
    logger.info(logContext, 'Creating product via API');
    const res = await createProduct(data);
    return NextResponse.json(res);
  } catch (error) {
    logger.error({ ...logContext, err: error }, 'Product creation API failed');
    return NextResponse.json(
      { success: false, message: formatError(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const logContext = { route: 'api.products.admin.delete' } as const;
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      logger.warn(logContext, 'Unauthorized delete attempt');
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const res = await deleteProduct(id);
    return NextResponse.json(res);
  } catch (error) {
    logger.error({ ...logContext, err: error }, 'Product deletion API failed');
    return NextResponse.json({ success: false, message: formatError(error) }, { status: 500 });
  }
}
