import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

// Next 와 같은 규칙으로 .env.local 을 읽는다.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // 마이그레이션은 풀러를 거치지 않는 직접 연결을 권장한다 (neon env pull 이 DATABASE_URL_UNPOOLED 로 넣어준다).
  dbCredentials: { url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)! },
});
