'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Product } from '@/types';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import Image from 'next/image';

const ProductCarousel = ({ data }: { data: Product[] }) => {
  return (
    <Carousel
      className='w-full mb-12'
      opts={{
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 10000,
          stopOnInteraction: true,
          stopOnMouseEnter: true,
        }),
      ]}
    >
      <CarouselContent>
        {data.map((product: Product) => {
          const heroImage = product.banner ?? product.images?.[0];
          if (!heroImage) return null;

          return (
            <CarouselItem key={product.id}>
              <Link href={`/product/${product.slug}`}>
                <div className='relative mx-auto aspect-[16/9] w-full overflow-hidden rounded-md'>
                  <Image
                    src={heroImage}
                    alt={product.name}
                    fill
                    sizes='100vw'
                    className='object-cover'
                    priority={product.isFeatured}
                  />
                  <div className='absolute inset-0 flex items-end justify-center'>
                    <h2 className='bg-gray-900 bg-opacity-50 text-2xl font-bold px-2 text-white'>
                      {product.name}
                    </h2>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};

export default ProductCarousel;
