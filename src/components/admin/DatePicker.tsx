'use client';

import { useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { ko } from 'react-day-picker/locale';
import { Button } from '@/components/shadcn/button';
import { Calendar } from '@/components/shadcn/calendar';
import { Input } from '@/components/shadcn/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover';
import { cn } from '@/lib/utils';

// 값은 'YYYY-MM-DD' 문자열. 시간대 문제를 피하려고 로컬 날짜로만 바꾼다 (UTC 변환 없음).
const toDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const toValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const label = (value: string) => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(toDate(value));

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** 고를 수 있는 범위 'YYYY-MM-DD' */
  min?: string;
  max?: string;
  placeholder?: string;
  /** 비울 수 있는 칸이면 × 버튼을 보여준다 */
  clearable?: boolean;
  className?: string;
};

// 날짜 칸: 누르면 달력이 뜬다 (shadcn Calendar). 년·월은 위쪽 선택 상자로 바로 옮길 수 있다.
export default function DatePicker({ id, value, onChange, min, max, placeholder = '날짜 선택', clearable, className }: Props) {
  const [open, setOpen] = useState(false);
  const selected = value ? toDate(value) : undefined;
  const thisYear = new Date().getFullYear();

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} type="button" variant="outline" className={cn('flex-1 justify-start font-normal', !value && 'text-muted-foreground')}>
            <CalendarIcon className="size-3.5 opacity-60" />
            {value ? label(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={ko}
            captionLayout="dropdown"
            startMonth={new Date(thisYear - 3, 0)}
            endMonth={new Date(thisYear + 5, 11)}
            selected={selected}
            defaultMonth={selected ?? (min ? toDate(min) : undefined)}
            disabled={[...(min ? [{ before: toDate(min) }] : []), ...(max ? [{ after: toDate(max) }] : [])]}
            onSelect={(date) => {
              if (!date) return;
              onChange(toValue(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {clearable && value && (
        <Button type="button" size="icon" variant="ghost" aria-label="날짜 지우기" onClick={() => onChange('')}>
          <X />
        </Button>
      )}
    </div>
  );
}

type DateTimeProps = Omit<Props, 'value' | 'onChange'> & {
  /** 'YYYY-MM-DDTHH:mm' 또는 '' */
  value: string;
  onChange: (value: string) => void;
};

// 날짜(달력) + 시각. 둘 다 채워야 값이 생기고, 하나만 채운 동안에는 화면에만 남겨둔다.
export function DateTimePicker({ value, onChange, clearable, ...props }: DateTimeProps) {
  const [date, setDate] = useState(value.slice(0, 10));
  const [time, setTime] = useState(value.slice(11, 16));
  const update = (nextDate: string, nextTime: string) => {
    setDate(nextDate);
    setTime(nextTime);
    onChange(nextDate && nextTime ? `${nextDate}T${nextTime}` : '');
  };

  return (
    <div className="flex items-center gap-2">
      <DatePicker {...props} value={date} onChange={(nextDate) => update(nextDate, time)} className="flex-1" />
      <Input type="time" value={time} onChange={(e) => update(date, e.target.value)} aria-label="시각" className="w-32" />
      {clearable && (date || time) && (
        <Button type="button" size="icon" variant="ghost" aria-label="지우기" onClick={() => update('', '')}>
          <X />
        </Button>
      )}
    </div>
  );
}
