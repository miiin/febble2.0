'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import LoginSheet from './LoginSheet';

const DEFAULT_MESSAGE = '로그인하고\n공연 소식을 모아보세요';

const LoginSheetContext = createContext<(message?: string) => void>(() => {});

// 어디서든 openLoginSheet('찜하려면 …') 로 로그인 시트를 띄운다.
export function useOpenLoginSheet() {
  return useContext(LoginSheetContext);
}

export default function LoginSheetProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const open = useCallback((nextMessage?: string) => {
    setMessage(nextMessage ?? DEFAULT_MESSAGE);
    setIsOpen(true);
  }, []);

  return (
    <LoginSheetContext.Provider value={open}>
      {children}
      <LoginSheet isOpen={isOpen} message={message} onClose={() => setIsOpen(false)} />
    </LoginSheetContext.Provider>
  );
}
