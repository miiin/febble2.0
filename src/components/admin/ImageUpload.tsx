'use client';

import { useRef, useState, useTransition } from 'react';
import { ImagePlus, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { uploadImage } from '@/lib/admin/mediaActions';
import { cn } from '@/lib/utils';

type Props = {
  folder: 'shows' | 'artists';
  value: string;
  onChange: (url: string) => void;
  /** 정사각형(아티스트) / 포스터 비율 */
  shape?: 'square' | 'poster';
};

// 큰 사진은 브라우저에서 먼저 줄여 올린다 (Vercel 요청 한도 4.5MB). 서버가 한 번 더 webp 로 줄인다.
export async function shrinkImage(file: File) {
  const MAX = 2000;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 3 * 1024 * 1024) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9));
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
}

// 이미지 칸: 파일을 고르거나 끌어다 놓으면 R2 에 올리고 주소를 넘긴다. 주소를 직접 적을 수도 있다.
export default function ImageUpload({ folder, value, onChange, shape = 'poster' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  const upload = (file: File | undefined) => {
    if (!file) return;
    startTransition(async () => {
      setError(undefined);
      const formData = new FormData();
      formData.set('folder', folder);
      formData.set('file', await shrinkImage(file));
      const result = await uploadImage(formData).catch(() => ({ error: '올리지 못했어요. 잠시 뒤 다시 시도해주세요.', url: undefined }));
      if (result.url) onChange(result.url);
      setError(result.error);
    });
  };

  return (
    <div className="grid gap-2">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            upload(e.dataTransfer.files[0]);
          }}
          className={cn(
            'relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/50 text-muted-foreground transition-colors hover:border-foreground',
            shape === 'square' ? 'size-32' : 'h-44 w-32',
            isDragging && 'border-foreground bg-accent',
          )}
          aria-label="이미지 올리기"
        >
          {value ? (
            <Image src={value} alt="" fill sizes="128px" unoptimized className="object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs">
              <ImagePlus className="size-5" />
              {isPending ? '올리는 중…' : '올리기'}
            </span>
          )}
          {value && isPending && <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs">올리는 중…</span>}
        </button>
        <div className="grid flex-1 content-start gap-2">
          <p className="text-xs text-muted-foreground">눌러서 고르거나 끌어다 놓으세요. 긴 변 1600px webp 로 줄여 저장해요.</p>
          <div className="flex gap-1">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="또는 이미지 주소 (/images/... 또는 https)"
              aria-label="이미지 주소"
            />
            {value && (
              <Button type="button" size="icon" variant="ghost" aria-label="이미지 빼기" onClick={() => onChange('')}>
                <X />
              </Button>
            )}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0] ?? undefined)} />
    </div>
  );
}
