'use client';

import { useState } from 'react';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { Label } from '@/components/shadcn/label';
import { Switch } from '@/components/shadcn/switch';
import type { KopisAddPreview } from '@/lib/admin/kopisBulkActions';

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '');
// 출연진에 섞여 오는 아티스트가 아닌 항목은 처음에 체크하지 않는다.
const looksLikeArtist = (name: string) => !/(게스트|guest|mc|사회|세션|스페셜|미정|O{2}|○|\*)/i.test(name);

type Props = {
  items: KopisAddPreview[] | undefined;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (options: { newArtists: string[]; publish: boolean }) => void;
};

// KOPIS 공연 추가 전 확인: 공연별 출연진 중 등록된 아티스트는 라인업에 연결하고,
// 처음 보는 이름은 새 아티스트로 만들지 고른다. 공개 여부도 여기서 정한다.
export default function KopisAddDialog({ items, isPending, onClose, onConfirm }: Props) {
  return (
    <Dialog open={!!items} onOpenChange={(open) => !open && !isPending && onClose()}>
      {/* 열 때마다 체크 상태를 새로 만든다 */}
      {items && <Body key={items.map((item) => item.reportId).join(',')} items={items} isPending={isPending} onConfirm={onConfirm} />}
    </Dialog>
  );
}

function Body({ items, isPending, onConfirm }: { items: KopisAddPreview[]; isPending: boolean; onConfirm: Props['onConfirm'] }) {
  // 여러 공연에 같은 이름이 나오면 한 번만 만든다.
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.flatMap((item) => item.unknown).map((name) => [normalize(name), looksLikeArtist(name)])),
  );
  const [publish, setPublish] = useState(false);
  const newArtists = [...new Map(items.flatMap((item) => item.unknown).map((name) => [normalize(name), name])).entries()]
    .filter(([key]) => checked[key])
    .map(([, name]) => name);

  return (
    <DialogContent className="max-h-[85vh] grid-rows-[auto_1fr_auto] sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>공연 {items.length}개 추가</DialogTitle>
        <DialogDescription>
          등록된 아티스트는 라인업에 연결돼요. 처음 보는 출연진은 체크하면 새 아티스트로 만들어 같이 연결해요 (장르·사진은 나중에 채워요).
        </DialogDescription>
      </DialogHeader>
      <ul className="-mx-6 divide-y overflow-y-auto border-y px-6">
        {items.map((item) => (
          <li key={item.reportId} className="grid gap-1.5 py-3 text-sm">
            <p className="font-medium">{item.title}</p>
            {item.matched.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-xs text-muted-foreground">연결</span>
                {item.matched.map((artist) => (
                  <Badge key={artist.id} className="bg-brand-yellow text-black">
                    {artist.name}
                  </Badge>
                ))}
              </div>
            )}
            {item.unknown.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs text-muted-foreground">새 아티스트</span>
                {item.unknown.map((name) => (
                  <label key={name} className="flex items-center gap-1.5 text-xs">
                    <Checkbox
                      checked={checked[normalize(name)] ?? false}
                      onCheckedChange={(on) => setChecked((prev) => ({ ...prev, [normalize(name)]: on === true }))}
                    />
                    {name}
                  </label>
                ))}
              </div>
            )}
            {item.noCast && item.matched.length === 0 && (
              <p className="text-xs text-muted-foreground">KOPIS 에 출연진이 없어요. 추가한 뒤 공연 화면에서 라인업을 넣어주세요.</p>
            )}
          </li>
        ))}
      </ul>
      <DialogFooter className="items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Switch id="kopis-publish" checked={publish} onCheckedChange={setPublish} />
          <Label htmlFor="kopis-publish" className="font-normal">
            {publish ? '바로 공개' : '비공개로 추가 (확인 후 공개)'}
          </Label>
        </div>
        <Button disabled={isPending} onClick={() => onConfirm({ newArtists, publish })}>
          {isPending ? '추가하는 중…' : `공연 ${items.length}개 추가${newArtists.length ? ` · 새 아티스트 ${newArtists.length}명` : ''}`}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
