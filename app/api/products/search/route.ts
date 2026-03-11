import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/actions/product.actions';
import { convertToPlainObject, formatError } from '@/lib/utils';
import { PAGE_SIZE } from '@/lib/constants';
import { logger } from '@/lib/logger';

const parsePositiveNumber = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export async function GET(request: Request) {
  const logContext = { route: 'api.products.search' } as const;

  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    logger.info(
      { ...logContext, params: rawParams },
      'Processing product search request'
    );

    const query = searchParams.get('q') ?? 'all';
    const category = searchParams.get('category') ?? 'all';
    const price = searchParams.get('price') ?? undefined;
    const rating = searchParams.get('rating') ?? undefined;
    const sort = searchParams.get('sort') ?? undefined;
    const page = parsePositiveNumber(searchParams.get('page'), 1);
    const limit = parsePositiveNumber(
      searchParams.get('limit'),
      PAGE_SIZE
    );

    const result = await getAllProducts({
      query,
      category,
      price,
      rating,
      sort,
      page,
      limit,
    });

    logger.info(
      {
        ...logContext,
        query,
        category,
        resultCount: result.data.length,
        page,
      },
      'Product search succeeded'
    );

    return NextResponse.json({
      data: convertToPlainObject(result.data),
      pagination: {
        page,
        limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    logger.error({ ...logContext, err: error }, 'Product search failed');
    return NextResponse.json(
      { error: formatError(error) },
      { status: 500 }
    );
  }
}
