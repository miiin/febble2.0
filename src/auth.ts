// Auth.js v5. 세션은 DB(sessions 테이블)에 저장한다 — 어댑터가 있으면 기본이 database 전략.
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Kakao, { type KakaoProfile } from 'next-auth/providers/kakao';
import { db } from '@/db';
import { accounts, sessions, users } from '@/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, { usersTable: users, accountsTable: accounts, sessionsTable: sessions }),
  // AUTH_GOOGLE_ID·SECRET, AUTH_KAKAO_ID(REST API 키)·SECRET 을 읽는다.
  // 카카오는 이메일 동의를 안 받을 수 있어 users.email 이 비어 있을 수 있다.
  providers: [
    // 동의항목을 명시해야 이미 연결된 사용자에게도 추가 동의 화면이 뜬다.
    // 카카오 콘솔에서 켜둔 항목만 넣는다 (안 켠 항목을 넣으면 KOE205). 사진이 필요하면 콘솔에서 켜고 profile_image 추가.
    // authorization 을 덮어쓰면 기본 주소가 사라지므로 url 도 같이 넣는다.
    Kakao({
      authorization: { url: 'https://kauth.kakao.com/oauth/authorize', params: { scope: 'profile_nickname' } },
    }),
    Google,
  ],
  pages: { signIn: '/login' },
  events: {
    // Auth.js 는 가입할 때만 이름·사진을 저장한다. 나중에 동의를 받았으면 비어 있는 값만 채운다.
    async signIn({ user, profile }) {
      if (!user.id || !profile) return;
      const kakao = (profile as unknown as Partial<KakaoProfile>).kakao_account?.profile;
      const name = user.name ?? profile.name ?? kakao?.nickname;
      const image = user.image ?? profile.picture ?? kakao?.profile_image_url;
      if (name === user.name && image === user.image) return;
      await db
        .update(users)
        .set({ name: name ?? null, image: image ?? null })
        .where(eq(users.id, user.id));
    },
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
