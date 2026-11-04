import { ReactNode, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const HtmlLangSync = (): ReactNode => {
  const [searchParams] = useSearchParams();
  const language = searchParams.get('language') === 'en' ? 'en' : 'fr';
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return null;
}
