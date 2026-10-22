import prisma from '../src/lib/prisma';

async function main() {
  const count = await prisma.college.count();
  const states = await prisma.college.groupBy({
    by: ['state'],
    _count: { id: true },
    orderBy: { state: 'asc' },
  });
  console.log(`Total colleges in DB: ${count}`);
  console.log('States breakdown:');
  states.forEach(s => {
    console.log(`  - ${s.state}: ${s._count.id} colleges`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
