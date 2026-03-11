import { NextResponse } from 'next/server';
import { getLatestProducts } from '@/lib/actions/product.actions';
import { formatError } from '@/lib/utils';
import { logger } from '@/lib/logger';

export async function GET() {
  const logContext = { route: 'api.products.latest' } as const;

  try {
    logger.info(logContext, 'Fetching latest products');
    const products = await getLatestProducts();

    logger.info(
      { ...logContext, count: products.length },
      'Latest products fetched successfully'
    );
    return NextResponse.json({
      data: products,
      count: products.length,
    });
  } catch (error) {
    logger.error({ ...logContext, err: error }, 'Latest products fetch failed');
    return NextResponse.json(
      { error: formatError(error) },
      { status: 500 }
    );
  }
}
