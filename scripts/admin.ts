// 관리자 권한 관리. 실행:
//   npm run db:admin                 계정 목록
//   npm run db:admin -- grant <id>   관리자로
//   npm run db:admin -- revoke <id>  일반 사용자로
import { loadEnvConfig } from '@next/env';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';

loadEnvConfig(process.cwd());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
const [command, userId] = process.argv.slice(2);

async function main() {
  if (command === 'grant' || command === 'revoke') {
    const [row] = await db
      .update(schema.users)
      .set({ role: command === 'grant' ? 'admin' : 'user' })
      .where(eq(schema.users.id, userId ?? ''))
      .returning({ id: schema.users.id, name: schema.users.name, role: schema.users.role });
    console.log(row ?? `없는 계정이에요: ${userId}`);
    return;
  }
  const rows = await db.execute(sql`SELECT u.id, u.name, a.provider, u.role, to_char(u.created_at, 'YYYY-MM-DD') AS joined
    FROM users u LEFT JOIN accounts a ON a.user_id = u.id ORDER BY u.created_at`);
  console.table(rows.rows);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
