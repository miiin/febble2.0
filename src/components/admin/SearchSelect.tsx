'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/shadcn/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover';
import { cn } from '@/lib/utils';

export type SearchOption = {
  value: string;
  label: string;
  /** 옆에 흐리게 붙는 설명 (예: 날짜, '라인업 밖') */
  hint?: string;
};

type Props = {
  options: SearchOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** 고른 뒤에도 값을 보여주지 않고 버튼 글자를 유지한다 (목록에 '추가' 하는 용도) */
  keepPlaceholder?: boolean;
  className?: string;
};

// 검색되는 선택 상자 (shadcn Combobox). 아티스트·공연이 많아져도 이름 일부로 찾는다.
export default function SearchSelect({ options, value, onChange, placeholder = '선택', keepPlaceholder, className }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className={cn('justify-between font-normal', className)}>
          <span className={cn('truncate', !selected || keepPlaceholder ? 'text-muted-foreground' : '')}>
            {selected && !keepPlaceholder ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command
          filter={(itemValue, search) => {
            const option = options.find((o) => o.value === itemValue);
            const text = `${option?.label ?? ''} ${option?.hint ?? ''} ${itemValue}`.toLowerCase().replace(/\s+/g, '');
            return text.includes(search.toLowerCase().replace(/\s+/g, '')) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="이름으로 찾기" />
          <CommandList>
            <CommandEmpty>찾는 항목이 없어요</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('size-3.5', value === option.value && !keepPlaceholder ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{option.label}</span>
                  {option.hint && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{option.hint}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
