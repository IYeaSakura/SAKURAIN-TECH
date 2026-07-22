'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { deploymentConfig } from '@/config/deployment-config';

/**
 * Phase 1：react-router 的 useNavigate 已替换为 next/navigation 的 useRouter。
 * navigate(path) → router.push(path)；navigate(-1) → router.back()。
 */
export function useNavigation() {
  const router = useRouter();

  const navigateTo = useCallback((path: string) => {
    if (deploymentConfig.useWindowLocation) {
      window.location.href = path;
    } else {
      router.push(path);
    }
  }, [router]);

  const goBack = useCallback(() => {
    if (deploymentConfig.useWindowLocation) {
      window.history.back();
    } else {
      router.back();
    }
  }, [router]);

  return {
    navigateTo,
    goBack,
    useWindowLocation: deploymentConfig.useWindowLocation,
    useNavigate: deploymentConfig.useNavigate,
  };
}
