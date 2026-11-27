import SiteFrame from '@/components/layout/SiteFrame';
import { Toaster } from '@/components/shadcn/sonner';

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <SiteFrame>
      {children}
      <Toaster position="bottom-center" />
    </SiteFrame>
  );
}
