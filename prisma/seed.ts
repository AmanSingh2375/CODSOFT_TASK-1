/**
 * EduManage - Prisma Seed Script
 * Run with: npx prisma db seed (or automatically populated via PGlite on server boot)
 */
import { seedDatabase, initDb } from '../src/server/db.ts';

async function main() {
  console.log('Starting EduManage database seeding...');
  await initDb();
  console.log('EduManage seeding completed successfully!');
}

main().catch((e) => {
  console.error('Error during seeding:', e);
  process.exit(1);
});
