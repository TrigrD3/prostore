import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

const connectionString = process.env.DATABASE_URL;
const isNeon = connectionString?.includes('neon.tech');

const baseExtension = {
  result: {
    product: {
      price: {
        compute(product: { price: { toString: () => string } }) {
          return product.price.toString();
        },
      },
      rating: {
        compute(product: { rating: { toString: () => string } }) {
          return product.rating.toString();
        },
      },
    },
    cart: {
      itemsPrice: {
        needs: { itemsPrice: true },
        compute(cart: { itemsPrice: { toString: () => string } }) {
          return cart.itemsPrice.toString();
        },
      },
      shippingPrice: {
        needs: { shippingPrice: true },
        compute(cart: { shippingPrice: { toString: () => string } }) {
          return cart.shippingPrice.toString();
        },
      },
      taxPrice: {
        needs: { taxPrice: true },
        compute(cart: { taxPrice: { toString: () => string } }) {
          return cart.taxPrice.toString();
        },
      },
      totalPrice: {
        needs: { totalPrice: true },
        compute(cart: { totalPrice: { toString: () => string } }) {
          return cart.totalPrice.toString();
        },
      },
    },
    order: {
      itemsPrice: {
        needs: { itemsPrice: true },
        compute(order: { itemsPrice: { toString: () => string } }) {
          return order.itemsPrice.toString();
        },
      },
      shippingPrice: {
        needs: { shippingPrice: true },
        compute(order: { shippingPrice: { toString: () => string } }) {
          return order.shippingPrice.toString();
        },
      },
      taxPrice: {
        needs: { taxPrice: true },
        compute(order: { taxPrice: { toString: () => string } }) {
          return order.taxPrice.toString();
        },
      },
      totalPrice: {
        needs: { totalPrice: true },
        compute(order: { totalPrice: { toString: () => string } }) {
          return order.totalPrice.toString();
        },
      },
    },
    orderItem: {
      price: {
        compute(orderItem: { price: { toString: () => string } }) {
          return orderItem.price.toString();
        },
      },
    },
  },
};

const extendClient = (client: PrismaClient) => client.$extends(baseExtension);

type ExtendedPrismaClient = ReturnType<typeof extendClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

const createClient = (): ExtendedPrismaClient => {
  if (isNeon && connectionString) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    return extendClient(new PrismaClient({ adapter }));
  }

  return extendClient(new PrismaClient());
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
