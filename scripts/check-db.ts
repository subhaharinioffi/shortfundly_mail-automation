import prisma from '../src/lib/prisma';

async function main() {
  const count = await prisma.college.count();
  const withWebsite = await prisma.college.count({
    where: {
      officialWebsite: { not: null },
      NOT: { officialWebsite: '-' },
    },
  });
  const crawled = await prisma.college.count({
    where: { lastCrawledAt: { not: null } },
  });
  const pendingRequests = await prisma.changeRequest.count({
    where: { status: 'PENDING' },
  });
  console.log(`Total colleges in DB: ${count}`);
  console.log(`Colleges with website: ${withWebsite}`);
  console.log(`Colleges with lastCrawledAt: ${crawled}`);
  console.log(`Pending change requests: ${pendingRequests}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
