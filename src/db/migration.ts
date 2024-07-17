import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../index';

(async () => {
  await migrate(db, { migrationsFolder: './drizzle' });
})();
