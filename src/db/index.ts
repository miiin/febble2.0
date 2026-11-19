import 'server-only';
import { attachDatabasePool } from '@vercel/functions';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// node-postgres 풀 (Neon 권장: Vercel Fluid compute). DATABASE_URL 은 -pooler 주소.
// @neondatabase/serverless 의 HTTP 드라이버는 fetch 를 써서, Next 가 'use cache' 안의 응답을
// fetch 캐시에 따로 저장해 빌드가 바뀌어도 옛 데이터를 돌려줬다.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
attachDatabasePool(pool);

export const db = drizzle(pool, { schema });
