'use client';

import { useRef, useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmButton from '@/components/admin/ConfirmButton';
import ImageUpload from '@/components/admin/ImageUpload';
import SpotifyPicker from '@/components/admin/SpotifyPicker';
import { Field, Section } from '@/components/admin/ui';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { deleteArtist, saveArtist } from '@/lib/admin/artistActions';
import { type GenreSuggestion, suggestArtistGenres } from '@/lib/admin/genreAI';
import { artistSlug, uniqueSlug } from '@/lib/slug';

type Artist = {
  id: string;
  name: string;
  image: string | null;
  genres: string[];
  bio: string;
  isEditorPick: boolean;
  spotifyArtistId: string | null;
  spotifyImageUrl: string | null;
};

type Props = {
  artist?: Artist;
  /** 이미 쓰고 있는 장르 (같은 표기로 맞추라는 안내용) */
  knownGenres: string[];
  /** 새 아티스트: 이미 있는 아티스트 id (자동으로 채운 id 가 겹치지 않게) */
  takenIds?: string[];
};

// Next 는 다녀간 화면의 상태를 남겨 두어서, 새 아티스트를 등록한 뒤 다시 /admin/artists/new 로 오면 직전 입력이 보인다.
// 등록하면 key 를 바꿔 폼을 새로 그린다 (Spotify·사진 칸 안의 상태까지 비운다).
export default function ArtistForm(props: Props) {
  const [formKey, setFormKey] = useState(0);
  return <ArtistFormBody key={formKey} {...props} onCreated={() => setFormKey((key) => key + 1)} />;
}

function ArtistFormBody({ artist, knownGenres, takenIds = [], onCreated }: Props & { onCreated: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [image, setImage] = useState(artist?.image ?? '');
  // 새 아티스트 id 는 이름(Spotify 를 고르면 Spotify 이름)으로 자동으로 채운다. 직접 고치면 그 값을 쓴다.
  const [name, setName] = useState('');
  const [spotifyName, setSpotifyName] = useState('');
  const [manualId, setManualId] = useState<string>();
  const id = manualId ?? uniqueSlug(artistSlug(spotifyName || name), new Set(takenIds));

  // 장르 AI 추천: 지금 적힌 이름·소개·연결한 Spotify 로 추천받아 장르 칸을 바꾼다 (되돌리기 가능).
  const formRef = useRef<HTMLFormElement>(null);
  const [genres, setGenres] = useState(artist?.genres.join(', ') ?? '');
  const [suggestion, setSuggestion] = useState<GenreSuggestion>();
  const [isSuggesting, startSuggesting] = useTransition();
  const suggestGenres = () =>
    startSuggesting(async () => {
      const formData = new FormData(formRef.current!);
      const result = await suggestArtistGenres({
        name: String(formData.get('name') ?? ''),
        bio: String(formData.get('bio') ?? ''),
        spotifyArtistId: String(formData.get('spotifyArtistId') ?? ''),
      }).catch(() => ({ error: '추천받지 못했어요. 잠시 뒤 다시 시도해주세요.', suggestion: undefined }));
      if (!result.suggestion) return void toast.error(result.error);
      setSuggestion(result.suggestion);
      if (result.suggestion.genres.length === 0) return void toast.message('추천할 장르를 찾지 못했어요');
      const before = genres;
      setGenres(result.suggestion.genres.join(', '));
      toast.success('장르를 채웠어요. 확인해주세요.', before ? { action: { label: '되돌리기', onClick: () => setGenres(before) } } : undefined);
    });

  // form action 대신 직접 제출한다 (action 은 끝나면 입력값을 비워서, 검사에 걸리면 적은 내용이 사라진다).
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveArtist(artist?.id ?? null, formData);
      setError(result.error);
      if (result.error) return;
      toast.success(artist ? '저장했어요' : '아티스트를 추가했어요');
      if (artist) return router.refresh();
      onCreated();
      router.push('/admin/artists');
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
    <form ref={formRef} onSubmit={onSubmit} className="mt-6 grid gap-6">
      <Section title="Info">
        {!artist && (
          <Field
            label="id (주소)"
            htmlFor="id"
            hint="이름(Spotify 를 연결하면 Spotify 이름)으로 자동으로 채워요. 대문자·띄어쓰기는 저장할 때 소문자·하이픈으로 바꿔요. /artists/[id] 주소가 되고 나중에 바꿀 수 없어요."
          >
            <Input id="id" name="id" required placeholder="silica-gel" value={id} onChange={(e) => setManualId(e.target.value)} />
          </Field>
        )}
        <Field label="이름" htmlFor="name">
          <Input id="name" name="name" required defaultValue={artist?.name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field
          label="장르"
          htmlFor="genres"
          hint={`쉼표로 구분, 1~3개. 추천이 장르 글자가 같은지로 동작해요. AI 추천은 이름·소개·Spotify 를 보고 아래 표기에 맞춰 채워요 (Spotify 를 먼저 연결하면 더 정확해요). 쓰고 있는 장르: ${knownGenres.join(', ') || '없음'}`}
        >
          <div className="flex gap-2">
            <Input id="genres" name="genres" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="인디 록, 포크" />
            <Button type="button" variant="outline" disabled={isSuggesting} onClick={suggestGenres} className="shrink-0">
              <Sparkles /> {isSuggesting ? '추천받는 중…' : 'AI 추천'}
            </Button>
          </div>
          {suggestion && (
            <p className="text-xs text-muted-foreground">
              {suggestion.confidence === 'low' && suggestion.genres.length > 0 && (
                <span className="mr-1 font-medium text-amber-700">추측이 섞였어요 ·</span>
              )}
              {suggestion.reason}
            </p>
          )}
        </Field>
        <Field label="소개" htmlFor="bio">
          <Textarea id="bio" name="bio" rows={3} defaultValue={artist?.bio} />
        </Field>
        <Field label="사진" hint="올린 사진이 없으면 연결한 Spotify 프로필 사진을 보여줘요.">
          <ImageUpload folder="artists" shape="square" value={image} onChange={setImage} />
          <input type="hidden" name="image" value={image} />
        </Field>
        <Field label="Spotify" hint="연결하면 사이트 아티스트 페이지에 미리듣기가 떠요. 사진·팔로워 수로 동명이인을 확인하세요.">
          <SpotifyPicker
            initialId={artist?.spotifyArtistId ?? null}
            initialImageUrl={artist?.spotifyImageUrl ?? null}
            getDefaultQuery={() => (document.getElementById('name') as HTMLInputElement | null)?.value ?? ''}
            onChoose={(chosen) => setSpotifyName(chosen.name)}
          />
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
