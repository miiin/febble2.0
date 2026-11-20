import Image from 'next/image';

type Props = {
  src?: string;
  alt: string;
  className?: string;
};

// 크기·모양은 className 으로 정한다. src 가 없으면 회색 플레이스홀더.
export default function Thumb({ src, alt, className = '' }: Props) {
  return (
    <div className={`relative shrink-0 overflow-hidden bg-neutral-200 ${className}`}>
      {src && <Image src={src} alt={alt} fill sizes="480px" className="object-cover" />}
    </div>
  );
}
