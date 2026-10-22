import { PrismaClient } from '@prisma/client';

let databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_DFwJ4WC0KsEa@ep-weathered-smoke-ar5u9har-pooler.c-4.us-west-2.aws.neon.tech/neondb?sslmode=require';

// Ensure proper connection pooling parameters for Neon serverless PgBouncer
if (databaseUrl.includes('pooler') && !databaseUrl.includes('connection_limit')) {
  const separator = databaseUrl.includes('?') ? '&' : '?';
  databaseUrl = `${databaseUrl}${separator}connection_limit=10&pool_timeout=20`;
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

if (!process.env.FIRECRAWL_API_KEY) {
  process.env.FIRECRAWL_API_KEY = 'fc-c615896e1c734aacac0844f7cbfc553f';
}

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: ['error'],
  });

globalForPrisma.prisma = prisma;

export default prisma;
