'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmButton from '@/components/admin/ConfirmButton';
import { Field, Section } from '@/components/admin/ui';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { deleteArtist, saveArtist } from '@/lib/admin/artistActions';

type Artist = {
  id: string;
  name: string;
  image: string | null;
  genres: string[];
  bio: string;
  isEditorPick: boolean;
  spotifyArtistId: string | null;
};

type Props = {
  artist?: Artist;
  /** 이미 쓰고 있는 장르 (같은 표기로 맞추라는 안내용) */
  knownGenres: string[];
};

export default function ArtistForm({ artist, knownGenres }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  // form action 대신 직접 제출한다 (action 은 끝나면 입력값을 비워서, 검사에 걸리면 적은 내용이 사라진다).
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveArtist(artist?.id ?? null, formData);
      setError(result.error);
      if (result.error) return;
      toast.success(artist ? '저장했어요' : '아티스트를 추가했어요');
      if (artist) router.refresh();
      else router.push(`/admin/artists/${result.id}`);
    });
  };

  const remove = () =>
    startTransition(async () => {
      const result = await deleteArtist(artist!.id);
      setError(result.error);
      if (result.error) return;
      toast.success(`${artist!.name} 을(를) 지웠어요`);
      router.push('/admin/artists');
    });

  return (
    <form onSubmit={onSubmit} className="mt-6 grid max-w-2xl gap-6">
      <Section title="Info">
        {!artist && (
          <Field label="id (주소)" htmlFor="id" hint="영문 소문자·숫자·하이픈. /artists/[id] 주소가 되고 나중에 바꿀 수 없어요.">
            <Input id="id" name="id" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="silica-gel" />
          </Field>
        )}
        <Field label="이름" htmlFor="name">
          <Input id="name" name="name" required defaultValue={artist?.name} />
        </Field>
        <Field label="장르" htmlFor="genres" hint={`쉼표로 구분. 추천이 장르 글자가 같은지로 동작해요. 쓰고 있는 장르: ${knownGenres.join(', ') || '없음'}`}>
          <Input id="genres" name="genres" defaultValue={artist?.genres.join(', ')} placeholder="인디 록, 포크" />
        </Field>
        <Field label="소개" htmlFor="bio">
          <Textarea id="bio" name="bio" rows={3} defaultValue={artist?.bio} />
        </Field>
        <Field label="이미지 주소" htmlFor="image" hint="public/images 아래 경로(/images/...) 또는 https 주소">
          <Input id="image" name="image" defaultValue={artist?.image ?? ''} />
        </Field>
        <Field label="Spotify 아티스트 ID" htmlFor="spotifyArtistId" hint="open.spotify.com/artist/ 뒤의 값. 있으면 미리듣기가 떠요.">
          <Input id="spotifyArtistId" name="spotifyArtistId" defaultValue={artist?.spotifyArtistId ?? ''} />
        </Field>
        <div className="flex items-center gap-2">
          <Checkbox id="isEditorPick" name="isEditorPick" defaultChecked={artist?.isEditorPick} />
          <Label htmlFor="isEditorPick" className="font-normal">
            에디터 추천 (비로그인 For you 의 빈칸을 채워요)
          </Label>
        </div>
      </Section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? '저장 중…' : '저장'}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/artists">목록</Link>
        </Button>
        {artist && (
          <ConfirmButton
            title={`${artist.name} 을(를) 지울까요?`}
            description="팔로우 기록도 같이 지워지고 되돌릴 수 없어요. 라인업이나 타임테이블에 들어간 아티스트는 지울 수 없어요."
            onConfirm={remove}
            disabled={isPending}
            variant="outline"
            className="ml-auto text-destructive"
          >
            삭제
          </ConfirmButton>
        )}
      </div>
    </form>
  );
}
