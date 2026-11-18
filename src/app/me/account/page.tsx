import LoginRequired from '@/components/auth/LoginRequired';
import AccountActions from '@/components/me/AccountActions';
import SectionTitle from '@/components/ui/SectionTitle';
import { formatShort } from '@/lib/date';
import { currentUser, isLoggedIn, PROVIDER_LABEL } from '@/mocks/session';

export default function AccountPage() {
  const rows = [
    { label: '이름', value: currentUser.name },
    { label: '로그인', value: `${PROVIDER_LABEL[currentUser.provider]} 계정` },
    { label: '이메일', value: currentUser.email ?? '받지 않음' },
    { label: '가입일', value: formatShort(currentUser.joinedAt) },
  ];

  return (
    <main className="px-4 pt-8 pb-14">
      <SectionTitle title="Account" sub="계정 설정" />
      {isLoggedIn ? (
        <>
          <dl className="mt-5 border-t border-black text-sm">
            {rows.map((row) => (
              <div key={row.label} className="flex gap-4 border-b border-black py-3">
                <dt className="w-16 shrink-0 text-xs leading-5">{row.label}</dt>
                <dd className="tracking-[-0.04em]">{row.value}</dd>
              </div>
            ))}
          </dl>
          <AccountActions />
        </>
      ) : (
        <LoginRequired message={'로그인하고\n계정을 관리하세요'} />
      )}
    </main>
  );
}
