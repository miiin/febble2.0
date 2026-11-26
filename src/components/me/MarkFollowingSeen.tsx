'use client';

import { useEffect } from 'react';
import { markFollowingSeen } from '@/lib/userActions';

// 화면을 그린 뒤 '봤음'을 기록한다. NEW 는 기록 전 시각으로 이미 계산돼 있어서 이번 방문에는 그대로 보인다.
export default function MarkFollowingSeen() {
  useEffect(() => {
    markFollowingSeen().catch(() => {});
  }, []);
  return null;
}
