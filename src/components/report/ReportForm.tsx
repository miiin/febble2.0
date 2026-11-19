'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { submitReport } from '@/lib/reportActions';

const FIELDS = [
  { name: 'title', label: '공연 · 페스티벌 이름', placeholder: '2027 부산 국제 락 페스티벌', required: true },
  { name: 'artists', label: '아티스트', placeholder: '실리카겔, 한로로' },
  { name: 'date', label: '날짜', placeholder: '10.1 – 10.2' },
  { name: 'venue', label: '장소', placeholder: '삼락생태공원, 부산' },
  { name: 'link', label: '참고 링크', placeholder: 'https://', type: 'url' },
] as const;

const INPUT = 'w-full rounded-lg border border-black px-3 py-2.5 text-sm tracking-[-0.04em] placeholder:text-black/30';

// 공연 제보. 공연 이름만 필수, 나머지는 아는 만큼.
export default function ReportForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  if (isSubmitted) {
    return (
      <div className="mt-10 border border-black px-4 py-10 text-center">
        <p className="text-lg font-medium tracking-[-0.04em]">제보 고마워요!</p>
        <p className="mt-2 text-sm leading-relaxed tracking-[-0.04em]">확인하고 febble에 올려둘게요.</p>
        <div className="mt-6 flex justify-center gap-4 text-xs underline underline-offset-2">
          <button type="button" onClick={() => setIsSubmitted(false)}>
            하나 더 제보하기
          </button>
          <Link href="/">홈으로</Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await submitReport(formData).catch(() => ({ error: '저장하지 못했어요. 잠시 뒤 다시 시도해주세요.' }));
          setError(result.error);
          if (!result.error) setIsSubmitted(true);
        });
      }}
      className="mt-6 flex flex-col gap-4"
    >
      {FIELDS.map((field) => (
        <label key={field.name} className="flex flex-col gap-1.5">
          <span className="text-xs">
            {field.label}
            {'required' in field && <span className="ml-0.5 text-black/50">*</span>}
          </span>
          <input
            name={field.name}
            type={'type' in field ? field.type : 'text'}
            required={'required' in field}
            placeholder={field.placeholder}
            className={INPUT}
          />
        </label>
      ))}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs">하고 싶은 말</span>
        <textarea name="message" rows={4} placeholder="타임테이블이 공개됐어요, 정보가 틀렸어요 등" className={`${INPUT} resize-none`} />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isPending} className="mt-2 flex h-12 items-center justify-center rounded-lg border border-black bg-brand-yellow text-sm">
        {isPending ? '보내는 중…' : '제보하기'}
      </button>
    </form>
  );
}
