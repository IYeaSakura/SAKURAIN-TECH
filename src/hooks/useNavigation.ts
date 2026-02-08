import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { deploymentConfig } from '@/config/deployment-config';

export function useNavigation() {
  const navigate = useNavigate();

  const navigateTo = useCallback((path: string) => {
    if (deploymentConfig.useWindowLocation) {
      window.location.href = path;
    } else {
      navigate(path);
    }
  }, [navigate]);

  const goBack = useCallback(() => {
    if (deploymentConfig.useWindowLocation) {
      window.history.back();
    } else {
      navigate(-1);
    }
  }, [navigate]);

  return {
    navigateTo,
    goBack,
    useWindowLocation: deploymentConfig.useWindowLocation,
    useNavigate: deploymentConfig.useNavigate,
  };
}
