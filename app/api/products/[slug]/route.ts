import { NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/actions/product.actions';
import { convertToPlainObject, formatError } from '@/lib/utils';
import { logger } from '@/lib/logger';

type Params = {
  slug: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> }
) {
  const logContext = { route: 'api.products.slug' } as const;
  let slug: string | undefined;

  try {
    const resolvedParams = await params;
    slug = resolvedParams.slug;
    logger.info({ ...logContext, slug }, 'Fetching product by slug');
    const product = await getProductBySlug(slug);

    if (!product) {
      logger.warn({ ...logContext, slug }, 'Product not found');
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    logger.info({ ...logContext, slug }, 'Product fetched successfully');
    return NextResponse.json({
      data: convertToPlainObject(product),
    });
  } catch (error) {
    logger.error({ ...logContext, slug, err: error }, 'Product lookup failed');
    return NextResponse.json(
      { error: formatError(error) },
      { status: 500 }
    );
  }
}
