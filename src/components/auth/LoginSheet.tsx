'use client';

import LoginButtons from '@/components/auth/LoginButtons';
import BottomSheet from '@/components/ui/BottomSheet';

type Props = {
  isOpen: boolean;
  message: string;
  onClose: () => void;
};

export default function LoginSheet({ isOpen, message, onClose }: Props) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} labelledBy="login-sheet-title">
      <h2 id="login-sheet-title" className="mt-6 text-xl leading-snug font-medium tracking-[-0.04em] whitespace-pre-line">
        {message}
      </h2>
      <div className="mt-6">
        <LoginButtons />
      </div>
    </BottomSheet>
  );
}
