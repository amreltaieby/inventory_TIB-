'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

const LanguageContext = createContext<{ lang: Language; setLang: (l: Language) => void }>({
  lang: 'en',
  setLang: function () {},
});

export function LanguageProvider(props: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(function () {
    const stored = localStorage.getItem('lang');
    if (stored === 'ar' || stored === 'en') setLangState(stored);
  }, []);

  const setLang = function (l: Language) {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  return <LanguageContext.Provider value={{ lang: lang, setLang: setLang }}>{props.children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}