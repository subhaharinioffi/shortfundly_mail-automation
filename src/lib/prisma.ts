import { PrismaClient } from '@prisma/client';

const DEFAULT_DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_DFwJ4WC0KsEa@ep-weathered-smoke-ar5u9har-pooler.c-4.us-west-2.aws.neon.tech/neondb?sslmode=require';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
}

if (!process.env.FIRECRAWL_API_KEY) {
  process.env.FIRECRAWL_API_KEY = 'fc-c615896e1c734aacac0844f7cbfc553f';
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: DEFAULT_DATABASE_URL,
      },
    },
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
