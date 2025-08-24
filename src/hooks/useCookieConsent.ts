import { useState, useEffect } from 'react';

export const useCookieConsent = () => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const storedConsent = localStorage.getItem('cookieConsent');
    setHasConsent(storedConsent === 'accepted');
  }, []);

  const checkCookieConsent = (): boolean => {
    const storedConsent = localStorage.getItem('cookieConsent');
    return storedConsent === 'accepted';
  };

  return {
    hasConsent,
    checkCookieConsent,
  };
}; 